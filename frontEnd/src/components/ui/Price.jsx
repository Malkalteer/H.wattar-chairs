import { useShowPrices } from '../../context/SiteContext';
import { formatCurrency } from '../../utils/format';

// يعرض السعر، أو "السعر عند الطلب" إذا أطفأ المدير عرض الأسعار
export default function Price({ value, className = '', hiddenText = 'السعر عند الطلب' }) {
  const show = useShowPrices();
  if (!show) return <span className={`${className} !text-base !font-bold`}>{hiddenText}</span>;
  return <span className={className}>{formatCurrency(value)}</span>;
}
