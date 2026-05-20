export type ExpiredProject = {
  id: string;
  subdomain: string;
  date_expire: Date | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
};