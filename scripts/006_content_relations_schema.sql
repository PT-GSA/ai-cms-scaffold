-- Content Relations Schema untuk AI CMS Scaffold
-- Support untuk One-to-One, One-to-Many, dan Many-to-Many relationships

-- Enum untuk relation types
DO $$ BEGIN
    CREATE TYPE relation_type AS ENUM (
        'one_to_one',
        'one_to_many', 
        'many_to_many'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum untuk cascade behaviors
DO $$ BEGIN
    CREATE TYPE cascade_behavior AS ENUM (
        'cascade',      -- Delete related records
        'set_null',     -- Set foreign key to null
        'restrict',     -- Prevent deletion if relations exist
        'no_action'     -- Do nothing
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content Relations Definitions Table
CREATE TABLE IF NOT EXISTS content_relation_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,                    -- e.g., "article_tags", "post_comments"
    display_name VARCHAR(200) NOT NULL,                   -- e.g., "Article Tags", "Post Comments"
    description TEXT,
    
    -- Source content type (the "owner" of the relation)
    source_content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
    source_field_name VARCHAR(100) NOT NULL,              -- Field name in source content
    
    -- Target content type (the "related" content)
    target_content_type_id INTEGER REFERENCES content_types(id) ON DELETE CASCADE,
    target_field_name VARCHAR(100),                       -- Field name in target content (for bi-directional)
    
    -- Relation configuration
    relation_type relation_type NOT NULL DEFAULT 'many_to_many',
    is_bidirectional BOOLEAN DEFAULT false,               -- Can navigate both ways
    is_required BOOLEAN DEFAULT false,                    -- Source must have at least one relation
    
    -- Cascade behavior
    on_source_delete cascade_behavior DEFAULT 'cascade',
    on_target_delete cascade_behavior DEFAULT 'set_null',
    
    -- Constraints untuk One-to-Many dan One-to-One
    max_relations INTEGER,                                 -- Max relations per source (NULL = unlimited)
    min_relations INTEGER DEFAULT 0,                      -- Min relations per source
    
    -- Metadata
    metadata JSONB DEFAULT '{}',                          -- Additional configuration
    sort_order INTEGER DEFAULT 0,                        -- Order in UI
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_source_field UNIQUE(source_content_type_id, source_field_name),
    CONSTRAINT valid_min_max CHECK (min_relations >= 0 AND (max_relations IS NULL OR max_relations >= min_relations))
);

-- Content Relations Data Table (stores actual relations)
CREATE TABLE IF NOT EXISTS content_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relation definition
    relation_definition_id UUID NOT NULL REFERENCES content_relation_definitions(id) ON DELETE CASCADE,
    
    -- Source and target content entries
    source_entry_id BIGINT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
    target_entry_id BIGINT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
    
    -- Relation metadata
    relation_data JSONB DEFAULT '{}',                     -- Additional data for this specific relation
    sort_order INTEGER DEFAULT 0,                        -- Order within the relation set
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_relation UNIQUE(relation_definition_id, source_entry_id, target_entry_id),
    CONSTRAINT no_self_reference CHECK (source_entry_id != target_entry_id)
);

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_content_relation_definitions_source_type 
    ON content_relation_definitions(source_content_type_id);

CREATE INDEX IF NOT EXISTS idx_content_relation_definitions_target_type 
    ON content_relation_definitions(target_content_type_id);

CREATE INDEX IF NOT EXISTS idx_content_relation_definitions_active 
    ON content_relation_definitions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_relations_definition 
    ON content_relations(relation_definition_id);

CREATE INDEX IF NOT EXISTS idx_content_relations_source 
    ON content_relations(source_entry_id);

CREATE INDEX IF NOT EXISTS idx_content_relations_target 
    ON content_relations(target_entry_id);

CREATE INDEX IF NOT EXISTS idx_content_relations_sort 
    ON content_relations(relation_definition_id, source_entry_id, sort_order);

-- Composite index untuk bi-directional lookups
CREATE INDEX IF NOT EXISTS idx_content_relations_bidirectional 
    ON content_relations(relation_definition_id, target_entry_id, source_entry_id);

-- Function untuk validate relation constraints
CREATE OR REPLACE FUNCTION validate_content_relation()
RETURNS TRIGGER AS $$
DECLARE
    rel_def RECORD;
    current_count INTEGER;
BEGIN
    -- Get relation definition
    SELECT * INTO rel_def 
    FROM content_relation_definitions 
    WHERE id = NEW.relation_definition_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Relation definition not found';
    END IF;
    
    -- Check if relation definition is active
    IF NOT rel_def.is_active THEN
        RAISE EXCEPTION 'Cannot create relation: definition is inactive';
    END IF;
    
    -- Validate content types match
    IF NOT EXISTS (
        SELECT 1 FROM content_entries ce 
        JOIN content_types ct ON ce.content_type_id = ct.id
        WHERE ce.id = NEW.source_entry_id AND ct.id = rel_def.source_content_type_id
    ) THEN
        RAISE EXCEPTION 'Source entry does not match expected content type';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM content_entries ce 
        JOIN content_types ct ON ce.content_type_id = ct.id
        WHERE ce.id = NEW.target_entry_id AND ct.id = rel_def.target_content_type_id
    ) THEN
        RAISE EXCEPTION 'Target entry does not match expected content type';
    END IF;
    
    -- For INSERT, check max relations constraint
    IF TG_OP = 'INSERT' THEN
        -- Count existing relations from source
        SELECT COUNT(*) INTO current_count
        FROM content_relations
        WHERE relation_definition_id = NEW.relation_definition_id
          AND source_entry_id = NEW.source_entry_id;
        
        -- Check max relations constraint
        IF rel_def.max_relations IS NOT NULL AND current_count >= rel_def.max_relations THEN
            RAISE EXCEPTION 'Maximum relations limit (%) exceeded for this source entry', rel_def.max_relations;
        END IF;
        
        -- For One-to-One relations, ensure uniqueness
        IF rel_def.relation_type = 'one_to_one' THEN
            -- Check source uniqueness
            IF current_count > 0 THEN
                RAISE EXCEPTION 'One-to-One relation: source entry already has a relation';
            END IF;
            
            -- Check target uniqueness
            IF EXISTS (
                SELECT 1 FROM content_relations
                WHERE relation_definition_id = NEW.relation_definition_id
                  AND target_entry_id = NEW.target_entry_id
            ) THEN
                RAISE EXCEPTION 'One-to-One relation: target entry already has a relation';
            END IF;
        END IF;
        
        -- For One-to-Many from target side, ensure uniqueness
        IF rel_def.relation_type = 'one_to_many' THEN
            IF EXISTS (
                SELECT 1 FROM content_relations
                WHERE relation_definition_id = NEW.relation_definition_id
                  AND target_entry_id = NEW.target_entry_id
            ) THEN
                RAISE EXCEPTION 'One-to-Many relation: target entry already belongs to another source';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk validate minimum relations on delete
CREATE OR REPLACE FUNCTION validate_min_relations()
RETURNS TRIGGER AS $$
DECLARE
    rel_def RECORD;
    remaining_count INTEGER;
BEGIN
    -- Get relation definition
    SELECT * INTO rel_def 
    FROM content_relation_definitions 
    WHERE id = OLD.relation_definition_id;
    
    IF NOT FOUND THEN
        RETURN OLD;
    END IF;
    
    -- Check minimum relations constraint
    IF rel_def.min_relations > 0 THEN
        SELECT COUNT(*) - 1 INTO remaining_count
        FROM content_relations
        WHERE relation_definition_id = OLD.relation_definition_id
          AND source_entry_id = OLD.source_entry_id;
        
        IF remaining_count < rel_def.min_relations THEN
            RAISE EXCEPTION 'Cannot delete relation: minimum relations requirement (%) would be violated', rel_def.min_relations;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk validation
DROP TRIGGER IF EXISTS validate_content_relation_trigger ON content_relations;
CREATE TRIGGER validate_content_relation_trigger
    BEFORE INSERT OR UPDATE ON content_relations
    FOR EACH ROW EXECUTE FUNCTION validate_content_relation();

DROP TRIGGER IF EXISTS validate_min_relations_trigger ON content_relations;
CREATE TRIGGER validate_min_relations_trigger
    BEFORE DELETE ON content_relations
    FOR EACH ROW EXECUTE FUNCTION validate_min_relations();

-- Function untuk get related content dengan deep fetching
CREATE OR REPLACE FUNCTION get_content_relations(
    p_source_entry_id BIGINT,
    p_relation_name TEXT DEFAULT NULL,
    p_include_metadata BOOLEAN DEFAULT false,
    p_max_depth INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    rel_def RECORD;
    relation_data JSONB;
BEGIN
    -- Loop through all relation definitions for this entry's content type
    FOR rel_def IN 
        SELECT 
            crd.*,
            source_ct.name as source_content_type_name,
            target_ct.name as target_content_type_name
        FROM content_relation_definitions crd
        JOIN content_types source_ct ON crd.source_content_type_id = source_ct.id
        JOIN content_types target_ct ON crd.target_content_type_id = target_ct.id
        JOIN content_entries ce ON ce.content_type_id = crd.source_content_type_id
        WHERE ce.id = p_source_entry_id
          AND crd.is_active = true
          AND (p_relation_name IS NULL OR crd.name = p_relation_name)
        ORDER BY crd.sort_order, crd.name
    LOOP
        -- Get relations for this definition
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', te.id,
                'slug', te.slug,
                'title', COALESCE(te.data->>'title', te.slug),
                'content_type', rel_def.target_content_type_name,
                'status', te.status,
                'published_at', te.published_at,
                'data', CASE WHEN p_include_metadata THEN te.data ELSE NULL END,
                'relation_data', CASE WHEN p_include_metadata THEN cr.relation_data ELSE NULL END,
                'sort_order', cr.sort_order
            )
            ORDER BY cr.sort_order, te.slug
        ) INTO relation_data
        FROM content_relations cr
        JOIN content_entries te ON cr.target_entry_id = te.id
        WHERE cr.relation_definition_id = rel_def.id
          AND cr.source_entry_id = p_source_entry_id;
        
        -- Add to result if relations found
        IF relation_data IS NOT NULL THEN
            result := result || jsonb_build_object(
                rel_def.source_field_name, 
                jsonb_build_object(
                    'type', rel_def.relation_type,
                    'definition_id', rel_def.id,
                    'display_name', rel_def.display_name,
                    'is_bidirectional', rel_def.is_bidirectional,
                    'items', relation_data,
                    'count', jsonb_array_length(relation_data)
                )
            );
        END IF;
    END LOOP;
    
    -- Handle bidirectional relations (where this entry is the target)
    FOR rel_def IN 
        SELECT 
            crd.*,
            source_ct.name as source_content_type_name,
            target_ct.name as target_content_type_name
        FROM content_relation_definitions crd
        JOIN content_types source_ct ON crd.source_content_type_id = source_ct.id
        JOIN content_types target_ct ON crd.target_content_type_id = target_ct.id
        JOIN content_entries ce ON ce.content_type_id = crd.target_content_type_id
        WHERE ce.id = p_source_entry_id
          AND crd.is_active = true
          AND crd.is_bidirectional = true
          AND crd.target_field_name IS NOT NULL
          AND (p_relation_name IS NULL OR crd.target_field_name = p_relation_name)
        ORDER BY crd.sort_order, crd.name
    LOOP
        -- Get reverse relations
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', se.id,
                'slug', se.slug,
                'title', COALESCE(se.data->>'title', se.slug),
                'content_type', rel_def.source_content_type_name,
                'status', se.status,
                'published_at', se.published_at,
                'data', CASE WHEN p_include_metadata THEN se.data ELSE NULL END,
                'relation_data', CASE WHEN p_include_metadata THEN cr.relation_data ELSE NULL END,
                'sort_order', cr.sort_order
            )
            ORDER BY cr.sort_order, se.slug
        ) INTO relation_data
        FROM content_relations cr
        JOIN content_entries se ON cr.source_entry_id = se.id
        WHERE cr.relation_definition_id = rel_def.id
          AND cr.target_entry_id = p_source_entry_id;
        
        -- Add reverse relations to result
        IF relation_data IS NOT NULL THEN
            result := result || jsonb_build_object(
                rel_def.target_field_name, 
                jsonb_build_object(
                    'type', rel_def.relation_type,
                    'definition_id', rel_def.id,
                    'display_name', rel_def.display_name || ' (reverse)',
                    'is_bidirectional', true,
                    'is_reverse', true,
                    'items', relation_data,
                    'count', jsonb_array_length(relation_data)
                )
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function untuk bulk create relations
CREATE OR REPLACE FUNCTION create_bulk_relations(
    p_relation_definition_id UUID,
    p_relations JSONB -- Array of {source_entry_id, target_entry_id, relation_data?, sort_order?}
)
RETURNS INTEGER AS $$
DECLARE
    relation_item JSONB;
    created_count INTEGER := 0;
    relation_record RECORD;
BEGIN
    -- Validate relation definition exists and is active
    SELECT * INTO relation_record
    FROM content_relation_definitions 
    WHERE id = p_relation_definition_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Relation definition not found or inactive';
    END IF;
    
    -- Process each relation
    FOR relation_item IN SELECT * FROM jsonb_array_elements(p_relations)
    LOOP
        -- Insert relation with error handling
        BEGIN
            INSERT INTO content_relations (
                relation_definition_id,
                source_entry_id,
                target_entry_id,
                relation_data,
                sort_order,
                created_by
            ) VALUES (
                p_relation_definition_id,
                (relation_item->>'source_entry_id')::BIGINT,
                (relation_item->>'target_entry_id')::BIGINT,
                COALESCE(relation_item->'relation_data', '{}'),
                COALESCE((relation_item->>'sort_order')::INTEGER, 0),
                auth.uid()
            );
            
            created_count := created_count + 1;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Skip duplicate relations
                CONTINUE;
            WHEN OTHERS THEN
                -- Re-raise other errors
                RAISE;
        END;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Function untuk cascade delete operations
CREATE OR REPLACE FUNCTION handle_cascade_relations()
RETURNS TRIGGER AS $$
DECLARE
    rel_def RECORD;
BEGIN
    -- Handle cascade behavior for relations where deleted entry is the source
    FOR rel_def IN 
        SELECT crd.* FROM content_relation_definitions crd
        JOIN content_entries ce ON ce.content_type_id = crd.source_content_type_id
        WHERE ce.id = OLD.id AND crd.on_source_delete != 'no_action'
    LOOP
        CASE rel_def.on_source_delete
            WHEN 'cascade' THEN
                -- Delete all relations where this entry is the source
                DELETE FROM content_relations 
                WHERE relation_definition_id = rel_def.id AND source_entry_id = OLD.id;
                
            WHEN 'set_null' THEN
                -- This doesn't apply to source entries (would break referential integrity)
                -- Relations are deleted by foreign key cascade
                NULL;
                
            WHEN 'restrict' THEN
                -- Check if relations exist
                IF EXISTS (
                    SELECT 1 FROM content_relations 
                    WHERE relation_definition_id = rel_def.id AND source_entry_id = OLD.id
                ) THEN
                    RAISE EXCEPTION 'Cannot delete entry: it has related content of type %', rel_def.display_name;
                END IF;
        END CASE;
    END LOOP;
    
    -- Handle cascade behavior for relations where deleted entry is the target
    FOR rel_def IN 
        SELECT crd.* FROM content_relation_definitions crd
        JOIN content_entries ce ON ce.content_type_id = crd.target_content_type_id
        WHERE ce.id = OLD.id AND crd.on_target_delete != 'no_action'
    LOOP
        CASE rel_def.on_target_delete
            WHEN 'cascade' THEN
                -- Delete all relations where this entry is the target
                DELETE FROM content_relations 
                WHERE relation_definition_id = rel_def.id AND target_entry_id = OLD.id;
                
            WHEN 'set_null' THEN
                -- This doesn't apply to target entries (would break referential integrity)
                -- Relations are deleted by foreign key cascade
                NULL;
                
            WHEN 'restrict' THEN
                -- Check if relations exist
                IF EXISTS (
                    SELECT 1 FROM content_relations 
                    WHERE relation_definition_id = rel_def.id AND target_entry_id = OLD.id
                ) THEN
                    RAISE EXCEPTION 'Cannot delete entry: other content is related to it via %', rel_def.display_name;
                END IF;
        END CASE;
    END LOOP;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk cascade operations
DROP TRIGGER IF EXISTS handle_cascade_relations_trigger ON content_entries;
CREATE TRIGGER handle_cascade_relations_trigger
    BEFORE DELETE ON content_entries
    FOR EACH ROW EXECUTE FUNCTION handle_cascade_relations();

-- Updated timestamps trigger
CREATE OR REPLACE FUNCTION update_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_relation_definitions_updated_at ON content_relation_definitions;
CREATE TRIGGER update_relation_definitions_updated_at
    BEFORE UPDATE ON content_relation_definitions
    FOR EACH ROW EXECUTE FUNCTION update_relations_updated_at();

DROP TRIGGER IF EXISTS update_content_relations_updated_at ON content_relations;
CREATE TRIGGER update_content_relations_updated_at
    BEFORE UPDATE ON content_relations
    FOR EACH ROW EXECUTE FUNCTION update_relations_updated_at();

-- Views untuk easier querying
CREATE OR REPLACE VIEW content_relations_summary AS
SELECT 
    crd.name as relation_name,
    crd.display_name,
    crd.relation_type,
    crd.is_bidirectional,
    source_ct.name as source_content_type,
    target_ct.name as target_content_type,
    COUNT(cr.id) as total_relations,
    COUNT(DISTINCT cr.source_entry_id) as unique_sources,
    COUNT(DISTINCT cr.target_entry_id) as unique_targets,
    crd.created_at as definition_created_at
FROM content_relation_definitions crd
LEFT JOIN content_types source_ct ON crd.source_content_type_id = source_ct.id
LEFT JOIN content_types target_ct ON crd.target_content_type_id = target_ct.id
LEFT JOIN content_relations cr ON crd.id = cr.relation_definition_id
WHERE crd.is_active = true
GROUP BY crd.id, crd.name, crd.display_name, crd.relation_type, crd.is_bidirectional,
         source_ct.name, target_ct.name, crd.created_at
ORDER BY crd.sort_order, crd.name;

-- RLS Policies
ALTER TABLE content_relation_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relations ENABLE ROW LEVEL SECURITY;

-- Policies untuk relation definitions
DROP POLICY IF EXISTS "Users can view relation definitions" ON content_relation_definitions;
CREATE POLICY "Users can view relation definitions" ON content_relation_definitions
    FOR SELECT USING (
        is_active = true AND (
            -- Public definitions atau user has access
            auth.uid() IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Admins can manage relation definitions" ON content_relation_definitions;
CREATE POLICY "Admins can manage relation definitions" ON content_relation_definitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('super_admin', 'admin', 'editor')
        )
    );

-- Policies untuk content relations
DROP POLICY IF EXISTS "Users can view content relations" ON content_relations;
CREATE POLICY "Users can view content relations" ON content_relations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_entries ce 
            WHERE (ce.id = content_relations.source_entry_id OR ce.id = content_relations.target_entry_id)
            AND (ce.status = 'published' OR ce.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage their content relations" ON content_relations;
CREATE POLICY "Users can manage their content relations" ON content_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM content_entries ce 
            WHERE ce.id = content_relations.source_entry_id 
            AND ce.created_by = auth.uid()
        )
    );

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_content_relations TO authenticated;
GRANT EXECUTE ON FUNCTION create_bulk_relations TO authenticated;
GRANT SELECT ON content_relations_summary TO authenticated;

-- Insert beberapa relation definitions contoh
INSERT INTO content_relation_definitions (
    name, display_name, description,
    source_content_type_id, source_field_name,
    target_content_type_id, target_field_name,
    relation_type, is_bidirectional, max_relations,
    created_by
) 
SELECT 
    'article_tags', 'Article Tags', 'Tags associated with articles',
    (SELECT id FROM content_types WHERE name = 'article' LIMIT 1), 'tags',
    (SELECT id FROM content_types WHERE name = 'article' LIMIT 1), 'tagged_articles',
    'many_to_many', true, NULL,
    NULL
WHERE EXISTS (SELECT 1 FROM content_types WHERE name = 'article')
ON CONFLICT (name) DO NOTHING;

-- Performance tuning
ALTER TABLE content_relation_definitions SET (fillfactor = 90);
ALTER TABLE content_relations SET (fillfactor = 85);

-- Statistics
ANALYZE content_relation_definitions;
ANALYZE content_relations;