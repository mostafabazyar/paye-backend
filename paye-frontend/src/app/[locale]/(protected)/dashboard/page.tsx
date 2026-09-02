'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['users', 'discover'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res?.users || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Find Your paye</h1>
          <p className="text-slate-400">People nearby who share your sports passion</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((user: User) => (
              <Card key={user.id} className="bg-slate-900 border-slate-800 overflow-hidden hover:border-blue-600 transition-colors">
                <div className="relative h-64">
                  <img
                    src={user.photos?.[0] || '/placeholder.jpg'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/70 text-white border-0">
                      {user.avgRating || 4.8} ★
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-semibold text-white">{user.name}</h3>
                    <p className="text-slate-400 text-sm">{user.age} • {user.gender}</p>
                  </div>

                  {user.bio && (
                    <p className="text-slate-400 line-clamp-2 mb-4 text-sm">{user.bio}</p>
                  )}

                  <Button className="w-full">
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}