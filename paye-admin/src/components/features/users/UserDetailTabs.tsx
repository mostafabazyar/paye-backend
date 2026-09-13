"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserListingsTab } from "./UserListingsTab";
import { UserRequestsTab } from "./UserRequestsTab";
import type { AdminProfile, AdminRequest } from "@/lib/types/admin";

type Props = {
  listings: AdminProfile[];
  sentRequests: AdminRequest[];
  receivedRequests: AdminRequest[];
};

export function UserDetailTabs({
  listings,
  sentRequests,
  receivedRequests,
}: Props) {
  return (
    <Tabs defaultValue="listings" className="w-full">
      <TabsList variant="line">
        <TabsTrigger value="listings">
          Listings ({listings.length})
        </TabsTrigger>
        <TabsTrigger value="sent">
          Sent ({sentRequests.length})
        </TabsTrigger>
        <TabsTrigger value="received">
          Received ({receivedRequests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listings" className="pt-4">
        <UserListingsTab listings={listings} />
      </TabsContent>

      <TabsContent value="sent" className="pt-4">
        <UserRequestsTab requests={sentRequests} direction="sent" />
      </TabsContent>

      <TabsContent value="received" className="pt-4">
        <UserRequestsTab requests={receivedRequests} direction="received" />
      </TabsContent>
    </Tabs>
  );
}