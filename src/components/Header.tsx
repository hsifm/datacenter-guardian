import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Server, Plus, Search, RefreshCw, Bell } from 'lucide-react';

interface HeaderProps {
  onRefresh?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ onRefresh, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">DC Inventory</h1>
              <p className="text-xs text-muted-foreground">Hardware Management System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search servers..." 
              className="pl-9 w-64 bg-muted/50"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4" />
          </Button>

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>
    </header>
  );
}
