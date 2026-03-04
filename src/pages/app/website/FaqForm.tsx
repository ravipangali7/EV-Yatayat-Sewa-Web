import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import { faqApi } from '@/modules/website/services/websiteApi';
import { toast } from 'sonner';

export default function FaqForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [is_active, setIsActive] = useState(true);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      try {
        const d = await faqApi.get(id);
        setQuestion(d.question || '');
        setAnswer(d.answer || '');
        setIsActive(d.is_active ?? true);
      } catch (e) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { question, answer, is_active };
      if (isEdit && id) {
        await faqApi.edit(id, payload);
        toast.success('Updated');
      } else {
        await faqApi.create(payload);
        toast.success('Created');
      }
      navigate('/admin/website/faqs');
    } catch (err) {
      console.error(err);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <PageHeader title="Edit FAQ" backUrl="/admin/website/faqs" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit FAQ' : 'Add FAQ'}
        backUrl="/admin/website/faqs"
      />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label>Question</Label>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div>
          <Label>Answer</Label>
          <RichTextEditor value={answer} onChange={setAnswer} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={is_active} onCheckedChange={setIsActive} />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/website/faqs')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
