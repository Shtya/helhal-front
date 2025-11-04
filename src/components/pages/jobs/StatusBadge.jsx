import { MetricBadge } from '@/components/dashboard/Ui';
import { Clock, CheckCircle, XCircle, Users, Settings as SettingsIcon } from 'lucide-react';

export default function StatusBadge({ status }) {

  const tone = status === 'completed' ? 'success' : status === 'awarded' ? 'success' : status === 'published' ? 'info' : status === 'closed' ? 'danger' : status === 'pending' ? 'neutral' : 'neutral';
  const icons = {
    pending: <Clock size={14} className='mr-1' />,
    draft: <Clock size={14} className='mr-1' />,
    published: <Users size={14} className='mr-1' />,
    awarded: <CheckCircle size={14} className='mr-1' />,
    completed: <CheckCircle size={14} className='mr-1' />,
    closed: <XCircle size={14} className='mr-1' />,
  };
  return (
    <MetricBadge tone={tone}>
      {icons[status] || null} {status}
    </MetricBadge>
  );
}