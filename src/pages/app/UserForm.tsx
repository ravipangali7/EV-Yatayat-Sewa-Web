import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getUser, createUser, updateUser } from '@/stores/mockData';
import { toast } from 'sonner';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '',
    name: '',
    password: '',
    is_driver: false,
    is_superuser: false,
    is_staff: false,
    is_active: true,
    profile_picture: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      const user = getUser(id);
      if (user) {
        setFormData({
          username: user.username,
          phone: user.phone,
          email: user.email,
          name: user.name,
          password: '',
          is_driver: user.is_driver,
          is_superuser: user.is_superuser || false,
          is_staff: user.is_staff || false,
          is_active: user.is_active ?? true,
          profile_picture: user.profile_picture || '',
        });
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && id) {
      updateUser(id, formData);
      toast.success('User updated successfully');
    } else {
      createUser(formData);
      toast.success('User created successfully');
    }
    navigate('/app/users');
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Add User'}
        subtitle={isEdit ? 'Update user information' : 'Create a new user'}
        backUrl="/app/users"
      />

      <form onSubmit={handleSubmit} className="form-section max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">Password {isEdit && '(leave blank to keep current)'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={!isEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile_picture">Profile Image URL</Label>
            <Input
              id="profile_picture"
              type="url"
              value={formData.profile_picture}
              onChange={(e) => handleChange('profile_picture', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="is_driver"
                checked={formData.is_driver}
                onCheckedChange={(checked) => handleChange('is_driver', checked)}
              />
              <Label htmlFor="is_driver">Is Driver</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_superuser"
                checked={formData.is_superuser}
                onCheckedChange={(checked) => handleChange('is_superuser', checked)}
              />
              <Label htmlFor="is_superuser">Super User</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_staff"
                checked={formData.is_staff}
                onCheckedChange={(checked) => handleChange('is_staff', checked)}
              />
              <Label htmlFor="is_staff">Is Staff</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Is Active</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="submit">{isEdit ? 'Update' : 'Create'} User</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/users')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
