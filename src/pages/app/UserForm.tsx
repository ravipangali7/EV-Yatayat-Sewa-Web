import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { userApi } from '@/modules/users/services/userApi';
import { toast } from 'sonner';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    is_driver: false,
    is_superuser: false,
    is_staff: false,
    is_active: true,
    profile_picture: null as File | null,
    license_no: '',
    license_image: null as File | null,
    license_type: '',
    license_expiry_date: '',
    is_ticket_dealer: false,
    ticket_commission: 0,
  });

  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const user = await userApi.get(id);
          setFormData({
            phone: user.phone || '',
            email: user.email || '',
            name: user.name || '',
            password: '',
            confirmPassword: '',
            is_driver: user.is_driver || false,
            is_superuser: user.is_superuser || false,
            is_staff: user.is_staff || false,
            is_active: user.is_active ?? true,
            profile_picture: null,
            license_no: user.license_no || '',
            license_image: null,
            license_type: user.license_type || '',
            license_expiry_date: user.license_expiry_date ? user.license_expiry_date.slice(0, 10) : '',
            is_ticket_dealer: user.is_ticket_dealer || false,
            ticket_commission: user.ticket_commission ?? 0,
          });
          // Set preview if profile picture exists
          if (user.profile_picture) {
            // Construct full media URL if it's a relative path
            const profilePicUrl = user.profile_picture.startsWith('http') 
              ? user.profile_picture 
              : `http://127.0.0.1:8000${user.profile_picture}`;
            setProfilePicturePreview(profilePicUrl);
          }
        } catch (error) {
          toast.error('Failed to load user');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUser();
  }, [id, isEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profile_picture: file }));
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');

    // Validate password match for new users
    if (!isEdit) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setPasswordError('Password is required');
        setLoading(false);
        return;
      }
    } else {
      // For edit, validate only if password is provided
      if (formData.password && formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      // Check if we have a file to upload
      const hasFile = formData.profile_picture instanceof File;

      if (hasFile) {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('phone', formData.phone);
        if (formData.email) {
          formDataToSend.append('email', formData.email);
        }
        if (formData.password) {
          formDataToSend.append('password', formData.password);
        }
        formDataToSend.append('is_driver', formData.is_driver.toString());
        formDataToSend.append('is_superuser', formData.is_superuser.toString());
        formDataToSend.append('is_staff', formData.is_staff.toString());
        formDataToSend.append('is_active', formData.is_active.toString());
        formDataToSend.append('profile_picture', formData.profile_picture);
        formDataToSend.append('license_no', formData.license_no);
        formDataToSend.append('license_type', formData.license_type);
        formDataToSend.append('license_expiry_date', formData.license_expiry_date || '');
        formDataToSend.append('is_ticket_dealer', formData.is_ticket_dealer.toString());
        formDataToSend.append('ticket_commission', formData.ticket_commission.toString());
        if (formData.license_image instanceof File) {
          formDataToSend.append('license_image', formData.license_image);
        }

        if (isEdit && id) {
          await userApi.editWithFile(id, formDataToSend);
          toast.success('User updated successfully');
        } else {
          await userApi.createWithFile(formDataToSend);
          toast.success('User created successfully');
        }
        // Clear file input after successful submission
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Use regular JSON for non-file updates
        // Explicitly build payload with only the fields we want - never include profile_picture
        const submitData: any = {
          name: formData.name,
          phone: formData.phone,
          is_driver: formData.is_driver,
          is_superuser: formData.is_superuser,
          is_staff: formData.is_staff,
          is_active: formData.is_active,
          license_no: formData.license_no || undefined,
          license_type: formData.license_type || undefined,
          license_expiry_date: formData.license_expiry_date || undefined,
          is_ticket_dealer: formData.is_ticket_dealer,
          ticket_commission: formData.ticket_commission,
        };
        
        // Only include email if it has a value
        if (formData.email) {
          submitData.email = formData.email;
        }
        
        // Only include password if provided (and not empty during edit)
        if (formData.password && (!isEdit || formData.password.trim() !== '')) {
          submitData.password = formData.password;
        }

        if (isEdit && id) {
          await userApi.edit(id, submitData);
          toast.success('User updated successfully');
        } else {
          await userApi.create(submitData);
          toast.success('User created successfully');
        }
      }
      navigate('/admin/users');
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Add User'}
        subtitle={isEdit ? 'Update user information' : 'Create a new user'}
        backUrl="/admin/users"
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
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">Password {isEdit && '(leave blank to keep current)'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                handleChange('password', e.target.value);
                setPasswordError('');
              }}
              required={!isEdit}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="confirmPassword">Confirm Password {isEdit && '(leave blank to keep current)'}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                handleChange('confirmPassword', e.target.value);
                setPasswordError('');
              }}
              required={!isEdit}
            />
            {passwordError && (
              <p className="text-sm text-destructive mt-1">{passwordError}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile_picture">Profile Image</Label>
            <Input
              id="profile_picture"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
              key={isEdit ? `file-input-${id}` : 'file-input-new'}
            />
            {profilePicturePreview && (
              <div className="mt-2">
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-32 h-32 object-cover rounded-lg border border-border"
                />
              </div>
            )}
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

          <h3 className="font-semibold text-foreground mt-6 mb-2">License & Ticket Dealer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="license_no">License No</Label>
              <Input
                id="license_no"
                value={formData.license_no}
                onChange={(e) => handleChange('license_no', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_type">License Type</Label>
              <Input
                id="license_type"
                value={formData.license_type}
                onChange={(e) => handleChange('license_type', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_expiry_date">License Expiry Date</Label>
              <Input
                id="license_expiry_date"
                type="date"
                value={formData.license_expiry_date}
                onChange={(e) => handleChange('license_expiry_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_image">License Image</Label>
              <Input
                id="license_image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFormData((prev) => ({ ...prev, license_image: file || null }));
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_ticket_dealer"
                checked={formData.is_ticket_dealer}
                onCheckedChange={(checked) => handleChange('is_ticket_dealer', checked)}
              />
              <Label htmlFor="is_ticket_dealer">Is Ticket Dealer</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_commission">Ticket Commission</Label>
              <Input
                id="ticket_commission"
                type="number"
                step="0.01"
                value={formData.ticket_commission}
                onChange={(e) => setFormData((prev) => ({ ...prev, ticket_commission: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create'} User</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
