-- Schema for Delivery Agent Dashboard with Flutter app integration
-- This schema defines all tables needed for both the admin dashboard and delivery agent app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (connected to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policy for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Create agents table (delivery personnel)
CREATE TABLE public.agents (
  id UUID PRIMARY KEY REFERENCES public.profiles(id),
  status TEXT CHECK (status IN ('online', 'offline', 'busy')) DEFAULT 'offline',
  rating NUMERIC DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  current_trip_id UUID,
  last_location JSONB, -- lat, lng
  last_active TIMESTAMPTZ DEFAULT now(),
  fcm_token TEXT, -- For push notifications
  verified BOOLEAN DEFAULT false
);

-- Create RLS policy for agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents are viewable by everyone" ON public.agents 
  FOR SELECT USING (true);
CREATE POLICY "Agents can update their own record" ON public.agents 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Only admins can insert agents" ON public.agents 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR auth.uid() = id
  );

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'canceled')) DEFAULT 'pending',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_location JSONB, -- lat, lng
  pickup_location JSONB, -- lat, lng (for waste collection)
  pickup_address TEXT,
  notes TEXT,
  total NUMERIC DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer')) DEFAULT 'cash',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  agent_id UUID REFERENCES public.agents(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  estimated_delivery_time TIMESTAMPTZ
);

-- Create RLS policy for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are viewable by everyone" ON public.orders 
  FOR SELECT USING (true);
CREATE POLICY "Only admins can insert orders" ON public.orders 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Admins can update any order" ON public.orders 
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Agents can update their assigned orders" ON public.orders 
  FOR UPDATE USING (
    auth.uid() = agent_id
  );

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC DEFAULT 0,
  waste_type TEXT, -- Type of waste for collection
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policy for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items are viewable by everyone" ON public.order_items 
  FOR SELECT USING (true);
CREATE POLICY "Only admins can insert order items" ON public.order_items 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Only admins can update order items" ON public.order_items 
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Create trips table (movement logs)
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES public.agents(id),
  order_id UUID REFERENCES public.orders(id),
  status TEXT CHECK (status IN ('assigned', 'started', 'completed', 'canceled')),
  start_location JSONB,
  end_location JSONB,
  distance NUMERIC, -- in kilometers
  duration INTEGER, -- in minutes
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policy for trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trips are viewable by everyone" ON public.trips 
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert and update trips" ON public.trips 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Agents can update their own trips" ON public.trips 
  FOR UPDATE USING (
    auth.uid() = agent_id
  );

-- Create locations table (location history)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES public.agents(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  trip_id UUID REFERENCES public.trips(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policy for locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are viewable by everyone" ON public.locations 
  FOR SELECT USING (true);
CREATE POLICY "Agents can insert their own locations" ON public.locations 
  FOR INSERT WITH CHECK (
    auth.uid() = agent_id
  );

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT false,
  related_id UUID, -- Can be order_id, trip_id, etc.
  related_type TEXT, -- 'order', 'trip', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policy for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Admins can insert notifications" ON public.notifications 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
CREATE POLICY "Users can update their own notifications" ON public.notifications 
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Create function to update orders updated_at on change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create stats function for dashboard
CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS TABLE (
  avg_delivery_time INTEGER,
  pending INTEGER,
  total INTEGER,
  in_progress INTEGER,
  delivered INTEGER,
  canceled INTEGER,
  excellent_trips INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      EXTRACT(EPOCH FROM AVG(completed_at - started_at))::INTEGER / 60,
      0
    ) AS avg_delivery_time,
    COUNT(*) FILTER (WHERE o.status = 'pending')::INTEGER AS pending,
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE o.status = 'in_progress')::INTEGER AS in_progress,
    COUNT(*) FILTER (WHERE o.status = 'completed')::INTEGER AS delivered,
    COUNT(*) FILTER (WHERE o.status = 'canceled')::INTEGER AS canceled,
    COUNT(*) FILTER (
      WHERE t.distance > 0 AND t.duration > 0 AND t.status = 'completed'
    )::INTEGER AS excellent_trips
  FROM
    public.orders o
  LEFT JOIN
    public.trips t ON o.id = t.order_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for agent status update
CREATE OR REPLACE FUNCTION public.update_agent_status(agent_id UUID, new_status TEXT)
RETURNS public.agents AS $$
DECLARE
  result public.agents;
BEGIN
  UPDATE public.agents
  SET 
    status = new_status,
    last_active = now()
  WHERE id = agent_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign order to agent
CREATE OR REPLACE FUNCTION public.assign_order_to_agent(order_id UUID, agent_id UUID)
RETURNS public.orders AS $$
DECLARE
  result public.orders;
  new_trip_id UUID;
BEGIN
  -- Create a new trip
  INSERT INTO public.trips (agent_id, order_id, status)
  VALUES (agent_id, order_id, 'assigned')
  RETURNING id INTO new_trip_id;
  
  -- Update the agent's current trip
  UPDATE public.agents
  SET 
    current_trip_id = new_trip_id,
    status = 'busy'
  WHERE id = agent_id;
  
  -- Update the order
  UPDATE public.orders
  SET 
    agent_id = agent_id,
    status = 'assigned',
    updated_at = now()
  WHERE id = order_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;