/**
 * Order Filtering & Search
 */

export class OrderFilters {
  static filterByStatus(orders: any[], status: string) {
    return orders.filter(o => o.status === status);
  }

  static filterByDateRange(orders: any[], startDate: Date, endDate: Date) {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  static filterByCustomer(orders: any[], customerId: string) {
    return orders.filter(o => o.customerId === customerId);
  }

  static filterByPriceRange(orders: any[], minPrice: number, maxPrice: number) {
    return orders.filter(o => o.total >= minPrice && o.total <= maxPrice);
  }

  static search(orders: any[], query: string) {
    const lowerQuery = query.toLowerCase();
    return orders.filter(o => 
      o.id.toLowerCase().includes(lowerQuery) ||
      o.customerId.toLowerCase().includes(lowerQuery) ||
      o.status.toLowerCase().includes(lowerQuery)
    );
  }

  static sort(orders: any[], sortBy: 'date' | 'amount' | 'status', ascending = false) {
    const sorted = [...orders];
    if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'amount') {
      sorted.sort((a, b) => a.total - b.total);
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    }
    return ascending ? sorted.reverse() : sorted;
  }
}
