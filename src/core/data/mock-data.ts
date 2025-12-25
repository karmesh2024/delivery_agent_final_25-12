import { Agent, Order, OrderStats, Trip } from "@/types";

/**
 * IMPORTANT: This file contains mock data that should only be used during development
 * when Supabase database connection is not available.
 * 
 * Production and testing environments should use real data from the database.
 * The app has been configured to use real data from Supabase by setting useMockData = false in supabase.ts.
 * 
 * If mock data appears in the application, it may be because:
 * 1. Real data is missing location coordinates in the database
 * 2. A component is directly importing from mock-data.ts instead of using data services
 * 
 * For maps: Only agents with valid location coordinates (non-zero, non-null) will be displayed.
 */

// Mock agents data (only used when database connection is unavailable)
export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Ahmed Mahmoud Ahmed",
    status: "online",
    avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
    location: {
      lat: 30.0444,
      lng: 31.2357
    },
    rating: 4.8,
    total_deliveries: 256,
    phone: "+20 123-456-7890",
    last_active: new Date().toISOString(),
    current_trip_id: "t1"
  },
  {
    id: "2",
    name: "Hossam Mahmoud Ahmed",
    status: "busy",
    avatar_url: "https://randomuser.me/api/portraits/men/42.jpg",
    location: {
      lat: 30.0544,
      lng: 31.2457
    },
    rating: 4.5,
    total_deliveries: 189,
    phone: "+20 123-456-7891",
    last_active: new Date().toISOString(),
    current_trip_id: "t2"
  },
  {
    id: "3",
    name: "Samir Ahmed Gamal",
    status: "offline",
    avatar_url: "https://randomuser.me/api/portraits/men/22.jpg",
    location: {
      lat: 30.0344,
      lng: 31.2257
    },
    rating: 4.2,
    total_deliveries: 122,
    phone: "+20 123-456-7892",
    last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    current_trip_id: null
  },
  {
    id: "4",
    name: "Adham Yasser Saeed",
    status: "online",
    avatar_url: "https://randomuser.me/api/portraits/men/12.jpg",
    location: {
      lat: 30.0644,
      lng: 31.2157
    },
    rating: 4.9,
    total_deliveries: 310,
    phone: "+20 123-456-7893",
    last_active: new Date().toISOString(),
    current_trip_id: "t3"
  },
  {
    id: "5",
    name: "Ashraf Moussa Saeed",
    status: "busy",
    avatar_url: "https://randomuser.me/api/portraits/men/62.jpg",
    location: {
      lat: 30.0744,
      lng: 31.2557
    },
    rating: 4.6,
    total_deliveries: 218,
    phone: "+20 123-456-7894",
    last_active: new Date().toISOString(),
    current_trip_id: "t4"
  },
  {
    id: "6",
    name: "Mahmoud Ali Hassan",
    status: "online",
    avatar_url: "https://randomuser.me/api/portraits/men/52.jpg",
    location: {
      lat: 30.0244,
      lng: 31.2657
    },
    rating: 4.7,
    total_deliveries: 276,
    phone: "+20 123-456-7895",
    last_active: new Date().toISOString(),
    current_trip_id: "t5"
  },
  {
    id: "7",
    name: "Khaled Mohamed Farouk",
    status: "offline",
    avatar_url: "https://randomuser.me/api/portraits/men/72.jpg",
    location: {
      lat: 30.0844,
      lng: 31.2757
    },
    rating: 4.3,
    total_deliveries: 145,
    phone: "+20 123-456-7896",
    last_active: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    current_trip_id: null
  },
  {
    id: "8",
    name: "Ibrahim Ahmed Nasser",
    status: "online",
    avatar_url: "https://randomuser.me/api/portraits/men/82.jpg",
    location: {
      lat: 30.0944,
      lng: 31.2857
    },
    rating: 4.8,
    total_deliveries: 267,
    phone: "+20 123-456-7897",
    last_active: new Date().toISOString(),
    current_trip_id: "t6"
  }
];

// Mock order stats
export const mockOrderStats: OrderStats = {
  avg_delivery_time: 28,
  pending: 15,
  total: 145,
  in_progress: 22,
  delivered: 98,
  canceled: 10,
  excellent_trips: 45
};

// Mock trips data
export const mockTrips: Trip[] = [
  {
    id: "t1",
    agent_id: "1",
    status: "in_progress",
    start_location: {
      lat: 30.0444,
      lng: 31.2357,
      address: "123 Main St, Cairo"
    },
    end_location: {
      lat: 30.0544,
      lng: 31.2457,
      address: "456 Oak St, Cairo"
    },
    distance: 3.2,
    duration: 15,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date().toISOString(),
    cost: 45.5,
    customer_name: "Mohamed Ahmed",
    customer_phone: "+20 123-456-7898"
  },
  {
    id: "t2",
    agent_id: "2",
    status: "in_progress",
    start_location: {
      lat: 30.0544,
      lng: 31.2457,
      address: "789 Pine St, Cairo"
    },
    end_location: {
      lat: 30.0644,
      lng: 31.2557,
      address: "101 Cedar St, Cairo"
    },
    distance: 4.8,
    duration: 22,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    updated_at: new Date().toISOString(),
    cost: 62.75,
    customer_name: "Ahmed Ali",
    customer_phone: "+20 123-456-7899"
  },
  {
    id: "t3",
    agent_id: "4",
    status: "assigned",
    start_location: {
      lat: 30.0644,
      lng: 31.2157,
      address: "202 Elm St, Cairo"
    },
    end_location: {
      lat: 30.0744,
      lng: 31.2257,
      address: "303 Birch St, Cairo"
    },
    distance: 2.5,
    duration: 12,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updated_at: new Date().toISOString(),
    cost: 35.25,
    customer_name: "Hossam Mohamed",
    customer_phone: "+20 123-456-7800"
  },
  {
    id: "t4",
    agent_id: "5",
    status: "in_progress",
    start_location: {
      lat: 30.0744,
      lng: 31.2557,
      address: "404 Maple St, Cairo"
    },
    end_location: {
      lat: 30.0844,
      lng: 31.2657,
      address: "505 Walnut St, Cairo"
    },
    distance: 5.2,
    duration: 25,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    updated_at: new Date().toISOString(),
    cost: 75.5,
    customer_name: "Ali Hassan",
    customer_phone: "+20 123-456-7801"
  },
  {
    id: "t5",
    agent_id: "6",
    status: "assigned",
    start_location: {
      lat: 30.0244,
      lng: 31.2657,
      address: "606 Spruce St, Cairo"
    },
    end_location: {
      lat: 30.0344,
      lng: 31.2757,
      address: "707 Cherry St, Cairo"
    },
    distance: 3.8,
    duration: 18,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    updated_at: new Date().toISOString(),
    cost: 52.25,
    customer_name: "Khaled Ahmed",
    customer_phone: "+20 123-456-7802"
  },
  {
    id: "t6",
    agent_id: "8",
    status: "assigned",
    start_location: {
      lat: 30.0944,
      lng: 31.2857,
      address: "808 Alder St, Cairo"
    },
    end_location: {
      lat: 30.1044,
      lng: 31.2957,
      address: "909 Fir St, Cairo"
    },
    distance: 6.4,
    duration: 30,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updated_at: new Date().toISOString(),
    cost: 88.5,
    customer_name: "Mahmoud Samir",
    customer_phone: "+20 123-456-7803"
  }
];

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: "o1",
    status: "pending",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    updated_at: new Date().toISOString(),
    customer_name: "Mohamed Ahmed",
    customer_address: "123 Main St, Cairo",
    customer_phone: "+20 123-456-7898",
    items: [
      { id: "i1", name: "Item 1", quantity: 2, price: 15.5 },
      { id: "i2", name: "Item 2", quantity: 1, price: 12.75 }
    ],
    total: 43.75,
    agent_id: null
  },
  {
    id: "o2",
    status: "in_progress",
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    updated_at: new Date().toISOString(),
    customer_name: "Ahmed Ali",
    customer_address: "456 Oak St, Cairo",
    customer_phone: "+20 123-456-7899",
    items: [
      { id: "i3", name: "Item 3", quantity: 3, price: 8.25 },
      { id: "i4", name: "Item 4", quantity: 2, price: 19 }
    ],
    total: 62.75,
    agent_id: "2",
    delivery_time: 45
  },
  {
    id: "o3",
    status: "delivered",
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(), // 3 hours ago
    updated_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
    customer_name: "Hossam Mohamed",
    customer_address: "789 Pine St, Cairo",
    customer_phone: "+20 123-456-7800",
    items: [
      { id: "i5", name: "Item 5", quantity: 1, price: 35.25 }
    ],
    total: 35.25,
    agent_id: "1",
    delivery_time: 35
  },
  {
    id: "o4",
    status: "canceled",
    created_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 210 * 60 * 1000).toISOString(), // 3.5 hours ago
    customer_name: "Ali Hassan",
    customer_address: "101 Cedar St, Cairo",
    customer_phone: "+20 123-456-7801",
    items: [
      { id: "i6", name: "Item 6", quantity: 2, price: 24.5 },
      { id: "i7", name: "Item 7", quantity: 1, price: 16.5 }
    ],
    total: 65.5,
    agent_id: null
  },
  {
    id: "o5",
    status: "pending",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date().toISOString(),
    customer_name: "Khaled Ahmed",
    customer_address: "202 Elm St, Cairo",
    customer_phone: "+20 123-456-7802",
    items: [
      { id: "i8", name: "Item 8", quantity: 4, price: 9.75 },
      { id: "i9", name: "Item 9", quantity: 1, price: 27.5 }
    ],
    total: 66.5,
    agent_id: null
  }
];