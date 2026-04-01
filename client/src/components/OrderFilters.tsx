import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface OrderFiltersProps {
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function OrderFilters({ onFilterChange, onClear }: OrderFiltersProps) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const handleApplyFilters = () => {
    onFilterChange({ status, search, sortBy });
  };

  const handleClear = () => {
    setStatus('');
    setSearch('');
    setSortBy('date');
    onClear();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="font-semibold">Filter Orders</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Search</label>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Order ID or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} className="flex-1">
          Apply Filters
        </Button>
        <Button onClick={handleClear} variant="outline" size="icon">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
