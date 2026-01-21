import { Plus, Trash2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ImageForm {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface VehicleImagesFormProps {
  value: ImageForm[];
  onChange: (images: ImageForm[]) => void;
}

export function VehicleImagesForm({ value, onChange }: VehicleImagesFormProps) {
  const addImage = () => {
    const newImage: ImageForm = {
      id: String(Date.now()),
      title: '',
      description: '',
      image: '',
    };
    onChange([...value, newImage]);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, field: keyof ImageForm, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, you'd upload to a storage service
      // For now, we'll use a placeholder URL
      const reader = new FileReader();
      reader.onload = () => {
        updateImage(index, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Vehicle Images</h3>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
          No images added. Click "Add Image" to add vehicle images.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {value.map((img, index) => (
            <div key={img.id} className="multiform-item">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={img.title}
                    onChange={(e) => updateImage(index, 'title', e.target.value)}
                    placeholder="e.g., Front View"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={img.description}
                    onChange={(e) => updateImage(index, 'description', e.target.value)}
                    placeholder="Describe the image..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-4">
                    {img.image ? (
                      <img
                        src={img.image}
                        alt={img.title}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center border border-border">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(index, e)}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
