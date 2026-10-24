import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-black text-primary mb-2">404</h1>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Không tìm thấy trang</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </p>
      <Button asChild>
        <Link href="/">Quay về trang chủ</Link>
      </Button>
    </div>
  );
}
