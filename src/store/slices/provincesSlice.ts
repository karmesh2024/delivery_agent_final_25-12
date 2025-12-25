import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface Province {
  id: string
  name_ar: string
  name_en?: string
  code: string
  country_code: string
  is_active: boolean
  created_at: Date
  updated_at: Date
  regions?: Region[]
}

export interface Region {
  id: number
  name: string
  name_ar?: string
  name_en?: string
  code?: string
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
  province_id?: string
  parent_region_id?: number
  cities?: City[]
}

export interface City {
  id: string
  region_id: number
  name_ar: string
  name_en?: string
  code: string
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

interface ProvincesState {
  provinces: Province[]
  regions: Region[]
  cities: City[]
  selectedProvince: Province | null
  selectedRegion: Region | null
  loading: boolean
  error: string | null
}

const initialState: ProvincesState = {
  provinces: [],
  regions: [],
  cities: [],
  selectedProvince: null,
  selectedRegion: null,
  loading: false,
  error: null
}

// Async Thunks
export const fetchProvinces = createAsyncThunk(
  'provinces/fetchProvinces',
  async () => {
    console.log('Redux: Fetching provinces...')
    const response = await fetch('/api/provinces?include_regions=true&include_cities=true')
    console.log('Redux: Response status:', response.status)
    if (!response.ok) {
      throw new Error('Failed to fetch provinces')
    }
    const provinces = await response.json()
    console.log('Redux: Received provinces:', provinces.length)
    console.log('Redux: First province:', provinces[0])
    return provinces
  }
)

export const fetchRegionsByProvince = createAsyncThunk(
  'provinces/fetchRegionsByProvince',
  async (provinceId: string) => {
    const response = await fetch(`/api/regions?province_id=${provinceId}&include_cities=true`)
    if (!response.ok) {
      throw new Error('Failed to fetch regions')
    }
    const regions = await response.json()
    return regions
  }
)

export const fetchCitiesByRegion = createAsyncThunk(
  'provinces/fetchCitiesByRegion',
  async (regionId: number) => {
    const response = await fetch(`/api/cities?region_id=${regionId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch cities')
    }
    const cities = await response.json()
    return cities
  }
)

export const createProvince = createAsyncThunk(
  'provinces/createProvince',
  async (provinceData: { name_ar: string; name_en?: string; code: string }) => {
    const response = await fetch('/api/provinces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(provinceData),
    })
    if (!response.ok) {
      throw new Error('Failed to create province')
    }
    const province = await response.json()
    return province
  }
)

export const createRegion = createAsyncThunk(
  'provinces/createRegion',
  async (regionData: { 
    name: string; 
    name_ar?: string; 
    name_en?: string; 
    code?: string; 
    province_id: string 
  }) => {
    const response = await fetch('/api/regions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(regionData),
    })
    if (!response.ok) {
      throw new Error('Failed to create region')
    }
    const region = await response.json()
    return region
  }
)

export const createCity = createAsyncThunk(
  'provinces/createCity',
  async (cityData: { 
    name_ar: string; 
    name_en?: string; 
    code: string; 
    region_id: number 
  }) => {
    const response = await fetch('/api/cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cityData),
    })
    if (!response.ok) {
      throw new Error('Failed to create city')
    }
    const city = await response.json()
    return city
  }
)

export const updateProvince = createAsyncThunk(
  'provinces/updateProvince',
  async ({ id, ...updateData }: { id: string } & Partial<Province>) => {
    const response = await fetch(`/api/provinces/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })
    if (!response.ok) {
      throw new Error('Failed to update province')
    }
    const province = await response.json()
    return province
  }
)

export const deleteProvince = createAsyncThunk(
  'provinces/deleteProvince',
  async (id: string) => {
    const response = await fetch(`/api/provinces/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete province')
    }
    return id
  }
)

// Slice
const provincesSlice = createSlice({
  name: 'provinces',
  initialState,
  reducers: {
    setSelectedProvince: (state, action: PayloadAction<Province | null>) => {
      state.selectedProvince = action.payload
      state.regions = action.payload?.regions || []
      state.cities = []
      state.selectedRegion = null
    },
    setSelectedRegion: (state, action: PayloadAction<Region | null>) => {
      state.selectedRegion = action.payload
      state.cities = action.payload?.cities || []
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Provinces
      .addCase(fetchProvinces.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProvinces.fulfilled, (state, action) => {
        state.loading = false
        state.provinces = action.payload
      })
      .addCase(fetchProvinces.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch provinces'
      })
      
      // Fetch Regions by Province
      .addCase(fetchRegionsByProvince.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRegionsByProvince.fulfilled, (state, action) => {
        state.loading = false
        state.regions = action.payload
      })
      .addCase(fetchRegionsByProvince.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch regions'
      })
      
      // Fetch Cities by Region
      .addCase(fetchCitiesByRegion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCitiesByRegion.fulfilled, (state, action) => {
        state.loading = false
        state.cities = action.payload
      })
      .addCase(fetchCitiesByRegion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch cities'
      })
      
      // Create Province
      .addCase(createProvince.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProvince.fulfilled, (state, action) => {
        state.loading = false
        state.provinces.push(action.payload)
      })
      .addCase(createProvince.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create province'
      })
      
      // Create Region
      .addCase(createRegion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRegion.fulfilled, (state, action) => {
        state.loading = false
        state.regions.push(action.payload)
        // Update the province's regions if it's selected
        if (state.selectedProvince) {
          const provinceIndex = state.provinces.findIndex(p => p.id === state.selectedProvince?.id)
          if (provinceIndex !== -1) {
            state.provinces[provinceIndex].regions?.push(action.payload)
          }
        }
      })
      .addCase(createRegion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create region'
      })
      
      // Create City
      .addCase(createCity.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCity.fulfilled, (state, action) => {
        state.loading = false
        state.cities.push(action.payload)
        // Update the region's cities if it's selected
        if (state.selectedRegion) {
          const regionIndex = state.regions.findIndex(r => r.id === state.selectedRegion?.id)
          if (regionIndex !== -1) {
            state.regions[regionIndex].cities?.push(action.payload)
          }
        }
      })
      .addCase(createCity.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create city'
      })
      
      // Update Province
      .addCase(updateProvince.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProvince.fulfilled, (state, action) => {
        state.loading = false
        const index = state.provinces.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.provinces[index] = action.payload
        }
        if (state.selectedProvince?.id === action.payload.id) {
          state.selectedProvince = action.payload
        }
      })
      .addCase(updateProvince.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update province'
      })
      
      // Delete Province
      .addCase(deleteProvince.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProvince.fulfilled, (state, action) => {
        state.loading = false
        state.provinces = state.provinces.filter(p => p.id !== action.payload)
        if (state.selectedProvince?.id === action.payload) {
          state.selectedProvince = null
          state.regions = []
          state.cities = []
          state.selectedRegion = null
        }
      })
      .addCase(deleteProvince.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete province'
      })
  }
})

export const { setSelectedProvince, setSelectedRegion, clearError } = provincesSlice.actions
export default provincesSlice.reducer
