import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { userApi } from '@/modules/users/services/userApi';
import { User } from '@/types';
import { toast } from 'sonner';

export default function UserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const userData = await userApi.get(id);
        setUser(userData);
      } catch (error) {
        toast.error('Failed to load user');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button className="mt-4" onClick={() => navigate('/app/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  const fields = [
    { label: 'Name', value: user.name },
    { label: 'Username', value: user.username },
    { label: 'Phone', value: user.phone },
    { label: 'Email', value: user.email },
    { label: 'Created At', value: new Date(user.created_at).toLocaleString() },
    { label: 'Updated At', value: new Date(user.updated_at).toLocaleString() },
  ];

  // Construct full media URL for profile picture
  const profilePictureUrl = user.profile_picture
    ? user.profile_picture.startsWith('http')
      ? user.profile_picture
      : `http://127.0.0.1:8000${user.profile_picture}`
    : null;

  return (
    <div>
      <PageHeader
        title="User Details"
        subtitle={user.name}
        backUrl="/app/users"
        actions={
          <Button onClick={() => navigate(`/app/users/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center py-4 border-b border-border">
              <div className="relative">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={`${user.name}'s profile`}
                    className="w-32 h-32 object-cover rounded-full border-4 border-border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-border bg-muted flex items-center justify-center">
                    <span className="text-4xl font-semibold text-muted-foreground">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Profile Picture</p>
            </div>
            
            {fields.map((field) => (
              <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{field.label}</span>
                <span className="font-medium">{field.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Is Driver</span>
              {user.is_driver ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Is Staff</span>
              {user.is_staff ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Super User</span>
              {user.is_superuser ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
