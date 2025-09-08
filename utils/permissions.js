// utils/permissions.js

// Master list of all possible permissions in the system
export const ALL_PERMISSIONS = [
  { label: "Dashboard", path: "/admin-dashboard" },
  { label: "Opportunity", path: "/admin-dashboard/oppurtunity" },
  {
    label: "Users",
    path: "/admin-dashboard/users",
    children: [
      { label: "All Users", path: "/admin-dashboard/users" }
    ]
  },
  {
    label: "Leads",
    path: "/admin-dashboard/leads",
    children: [
      { label: "Create Lead", path: "/admin-dashboard/mannual-leads/add" }
    ]
  },
  { label: "Manual Leads", path: "/admin-dashboard/mannual-leads" },
  { label: "Website Leads", path: "/admin-dashboard/contact" },
  {
    label: "Meta",
    path: "/admin-dashboard/meta",
    children: [
      { label: "Meta Leads", path: "/admin-dashboard/meta" },
      { label: "CA Leads", path: "/admin-dashboard/ca-leads" },
      { label: "Digital Leads", path: "/admin-dashboard/digital-leads" },
      { label: "Web Dev Leads", path: "/admin-dashboard/web-development-leads" },
      { label: "Travel Leads", path: "/admin-dashboard/travel-agency-leads" }
    ]
  },
  {
    label: "Google",
    path: "/admin-dashboard/google",
    children: [
      { label: "Google Ads", path: "/admin-dashboard/google-ads" }
    ]
  },
  { label: "Stats", path: "/admin-dashboard/stats" },
  { label: "Appointments", path: "/admin-dashboard/appointments" },
  { label: "Integrations", path: "/admin-dashboard/integrations" },
  { label: "Reports", path: "/admin-dashboard/reports" },
  { label: "Settings", path: "/admin-dashboard/settings" }
];