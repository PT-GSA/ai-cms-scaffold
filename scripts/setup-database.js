#!/usr/bin/env node

/**
 * Script untuk setup database CMS secara otomatis
 * Menjalankan inisialisasi database dan membuat sample data
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Memeriksa status database...')
    
    const response = await fetch(`${BASE_URL}/api/setup/status`)
    const data = await response.json()
    
    if (data.success) {
      const status = data.status
      console.log('📊 Status Database:')
      console.log(`   - Database initialized: ${status.database.initialized ? '✅' : '❌'}`)
      console.log(`   - Content types count: ${status.content_types.count}`)
      console.log(`   - Fields count: ${status.content_types.fields_count}`)
      console.log(`   - Overall ready: ${status.overall.ready ? '✅' : '❌'}`)
      
      return status
    } else {
      console.error('❌ Error checking status:', data.message)
      return null
    }
  } catch (error) {
    console.error('❌ Error checking database status:', error.message)
    return null
  }
}

async function initializeDatabase() {
  try {
    console.log('🚀 Menginisialisasi database...')
    
    const response = await fetch(`${BASE_URL}/api/setup/init-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Database berhasil diinisialisasi!')
      console.log(`📝 ${data.data.total_content_types} content types dibuat`)
      
      // Tampilkan daftar content types
      if (data.data.content_types && data.data.content_types.length > 0) {
        console.log('📋 Content Types yang dibuat:')
        data.data.content_types.forEach((ct) => {
          console.log(`   - ${ct.display_name} (${ct.name})`)
        })
      }
      
      return true
    } else {
      console.error('❌ Error initializing database:', data.message)
      return false
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message)
    return false
  }
}

async function testContentTypesAPI() {
  try {
    console.log('🧪 Menguji API content types...')
    
    const response = await fetch(`${BASE_URL}/api/public/content-types`)
    const data = await response.json()
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ API content types berfungsi dengan baik!')
      console.log(`📊 Ditemukan ${data.length} content types:`)
      data.forEach((ct) => {
        console.log(`   - ${ct.display_name} (${ct.name})`)
      })
      return true
    } else {
      console.error('❌ API content types tidak mengembalikan data yang valid')
      return false
    }
  } catch (error) {
    console.error('❌ Error testing content types API:', error.message)
    return false
  }
}

async function main() {
  console.log('🎯 CMS Database Setup Script')
  console.log('============================')
  
  // 1. Cek status database
  const status = await checkDatabaseStatus()
  
  if (!status) {
    console.log('❌ Tidak dapat memeriksa status database. Pastikan server berjalan.')
    process.exit(1)
  }
  
  // 2. Jika database belum siap, inisialisasi
  if (status.overall.needs_setup) {
    console.log('\n🔧 Database memerlukan setup...')
    const initSuccess = await initializeDatabase()
    
    if (!initSuccess) {
      console.log('❌ Gagal menginisialisasi database')
      process.exit(1)
    }
  } else {
    console.log('✅ Database sudah siap!')
  }
  
  // 3. Test API content types
  console.log('\n🧪 Menguji API...')
  const apiTestSuccess = await testContentTypesAPI()
  
  if (!apiTestSuccess) {
    console.log('❌ API content types tidak berfungsi dengan baik')
    process.exit(1)
  }
  
  console.log('\n🎉 Setup database selesai!')
  console.log('✅ Database siap digunakan')
  console.log('✅ API content types berfungsi')
  console.log(`🌐 Akses playground di: ${BASE_URL}/dashboard/playground`)
}

// Jalankan script
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
