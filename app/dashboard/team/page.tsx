"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Mail, UserPlus, Trash2, Edit } from "lucide-react"

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'editor' | 'author' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  avatar?: string
  joined_at: string
  last_active?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  invited_by: string
  invited_at: string
  expires_at: string
}

/**
 * Halaman Team Management untuk mengelola anggota tim dan undangan
 */
export default function TeamPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadTeamData()
    }
  }, [user])

  const loadTeamData = async () => {
    setIsLoading(true)
    try {
      // Ambil data team members
      const membersResponse = await fetch('/api/team/members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` // TODO: Use proper auth
        }
      })
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setTeamMembers(membersData.data || [])
      }

      // Ambil data invitations
      const invitationsResponse = await fetch('/api/team/invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` // TODO: Use proper auth
        }
      })
      
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json()
        setInvitations(invitationsData.data || [])
      }
    } catch (error) {
      console.error("Error loading team data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      case 'editor': return 'secondary'
      case 'author': return 'outline'
      case 'viewer': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'inactive': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'editor': return 'Editor'
      case 'author': return 'Author'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredInvitations = invitations.filter(invitation =>
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Team Management
            </h1>
            <p className="text-gray-400">
              Kelola anggota tim dan undangan untuk akses CMS
            </p>
          </div>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <InviteMemberForm 
                  onClose={() => setIsInviteDialogOpen(false)} 
                  onSuccess={loadTeamData}
                />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Members</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              Team Members ({filteredMembers.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({filteredInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No team members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-white">{member.name}</div>
                              <div className="text-sm text-gray-400">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInvitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No pending invitations
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium text-white">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(invitation.role)}>
                            {getRoleDisplayName(invitation.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(invitation.status)}>
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {invitation.invited_by}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

/**
 * Form untuk mengundang member baru
 */
function InviteMemberForm({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("author")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` // TODO: Use proper auth
        },
        body: JSON.stringify({ email, role })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Invitation sent:', result)
        
        // Reload team data
        if (onSuccess) {
          onSuccess()
        }
        
        // Reset form dan close dialog
        setEmail("")
        setRole("author")
        onClose()
      } else {
        const error = await response.json()
        console.error('Error sending invitation:', error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error inviting member:", error)
      // TODO: Show error message to user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer - Can only view content</SelectItem>
            <SelectItem value="author">Author - Can create and edit own content</SelectItem>
            <SelectItem value="editor">Editor - Can edit all content</SelectItem>
            <SelectItem value="admin">Admin - Full access except user management</SelectItem>
            <SelectItem value="super_admin">Super Admin - Full access</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  )
}
