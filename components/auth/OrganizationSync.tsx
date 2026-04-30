"use client";

import { useOrganizationList, useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function OrganizationSync() {
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Auto-select Organization if none active
  useEffect(() => {
    if (!isLoaded || organization) return;

    if (userMemberships.data && userMemberships.data.length > 0) {
      const firstOrgId = userMemberships.data[0].organization.id;
      setActive({ organization: firstOrgId });
    }
  }, [isLoaded, organization, userMemberships.data, setActive]);

  // 2. Clean up Clerk query parameters for a professional look
  useEffect(() => {
    const hasClerkParams = searchParams.get("__clerk_status") || searchParams.get("__clerk_created_session");
    
    if (hasClerkParams) {
      const url = new URL(window.location.href);
      url.searchParams.delete("__clerk_status");
      url.searchParams.delete("__clerk_created_session");
      url.searchParams.delete("__clerk_handshaking");
      url.searchParams.delete("__clerk_help");
      
      router.replace(url.toString(), { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
