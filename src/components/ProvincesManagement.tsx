import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchProvinces,
  fetchRegionsByProvince,
  fetchCitiesByRegion,
  createProvince,
  createRegion,
  createCity,
  setSelectedProvince,
  setSelectedRegion,
  clearError
} from '../store/slices/provincesSlice'
import { Province, Region, City } from '../store/slices/provincesSlice'

const ProvincesManagement: React.FC = () => {
  const dispatch = useAppDispatch()
  const { 
    provinces, 
    regions, 
    cities, 
    selectedProvince, 
    selectedRegion, 
    loading, 
    error 
  } = useAppSelector(state => state.provinces)
  
  console.log('Component: Redux state:', { provinces: provinces.length, regions: regions.length, cities: cities.length, loading, error })

  const [showAddProvince, setShowAddProvince] = useState(false)
  const [showAddRegion, setShowAddRegion] = useState(false)
  const [showAddCity, setShowAddCity] = useState(false)

  // Form states
  const [provinceForm, setProvinceForm] = useState({
    name_ar: '',
    name_en: '',
    code: ''
  })
  const [regionForm, setRegionForm] = useState({
    name: '',
    name_ar: '',
    name_en: '',
    code: ''
  })
  const [cityForm, setCityForm] = useState({
    name_ar: '',
    name_en: '',
    code: ''
  })

  useEffect(() => {
    console.log('Component: Dispatching fetchProvinces...')
    dispatch(fetchProvinces())
  }, [dispatch])

  useEffect(() => {
    if (selectedProvince) {
      dispatch(fetchRegionsByProvince(selectedProvince.id))
    }
  }, [dispatch, selectedProvince])

  useEffect(() => {
    if (selectedRegion) {
      dispatch(fetchCitiesByRegion(selectedRegion.id))
    }
  }, [dispatch, selectedRegion])

  const handleProvinceSelect = (province: Province) => {
    dispatch(setSelectedProvince(province))
  }

  const handleRegionSelect = (region: Region) => {
    dispatch(setSelectedRegion(region))
  }

  const handleCreateProvince = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(createProvince(provinceForm)).unwrap()
      setProvinceForm({ name_ar: '', name_en: '', code: '' })
      setShowAddProvince(false)
    } catch (error) {
      console.error('Error creating province:', error)
    }
  }

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvince) return
    
    try {
      await dispatch(createRegion({
        ...regionForm,
        province_id: selectedProvince.id
      })).unwrap()
      setRegionForm({ name: '', name_ar: '', name_en: '', code: '' })
      setShowAddRegion(false)
    } catch (error) {
      console.error('Error creating region:', error)
    }
  }

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegion) return
    
    try {
      await dispatch(createCity({
        ...cityForm,
        region_id: selectedRegion.id
      })).unwrap()
      setCityForm({ name_ar: '', name_en: '', code: '' })
      setShowAddCity(false)
    } catch (error) {
      console.error('Error creating city:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => dispatch(clearError())}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحافظات */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">المحافظات</h3>
            <button
              onClick={() => setShowAddProvince(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              إضافة محافظة +
            </button>
          </div>

          {showAddProvince && (
            <form onSubmit={handleCreateProvince} className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="الاسم العربي"
                  value={provinceForm.name_ar}
                  onChange={(e) => setProvinceForm({...provinceForm, name_ar: e.target.value})}
                  className="px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم الإنجليزي"
                  value={provinceForm.name_en}
                  onChange={(e) => setProvinceForm({...provinceForm, name_en: e.target.value})}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="الكود"
                  value={provinceForm.code}
                  onChange={(e) => setProvinceForm({...provinceForm, code: e.target.value})}
                  className="px-3 py-2 border rounded"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProvince(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {provinces.map((province) => (
              <div
                key={province.id}
                onClick={() => handleProvinceSelect(province)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedProvince?.id === province.id
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{province.name_ar}</span>
                  <span className="text-sm text-gray-500">({province.code})</span>
                </div>
                <div className="text-sm text-gray-600">
                  منطقة {province.regions?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* المناطق */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">المناطق</h3>
            {selectedProvince && (
              <button
                onClick={() => setShowAddRegion(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                إضافة منطقة +
              </button>
            )}
          </div>

          {showAddRegion && selectedProvince && (
            <form onSubmit={handleCreateRegion} className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="الاسم"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({...regionForm, name: e.target.value})}
                  className="px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم العربي"
                  value={regionForm.name_ar}
                  onChange={(e) => setRegionForm({...regionForm, name_ar: e.target.value})}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="الاسم الإنجليزي"
                  value={regionForm.name_en}
                  onChange={(e) => setRegionForm({...regionForm, name_en: e.target.value})}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="الكود"
                  value={regionForm.code}
                  onChange={(e) => setRegionForm({...regionForm, code: e.target.value})}
                  className="px-3 py-2 border rounded"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRegion(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {regions.map((region) => (
              <div
                key={region.id}
                onClick={() => handleRegionSelect(region)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedRegion?.id === region.id
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{region.name_ar || region.name}</span>
                  {region.code && (
                    <span className="text-sm text-gray-500">({region.code})</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  مدينة {region.cities?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* المدن */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">المدن</h3>
            {selectedRegion && (
              <button
                onClick={() => setShowAddCity(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                إضافة مدينة +
              </button>
            )}
          </div>

          {showAddCity && selectedRegion && (
            <form onSubmit={handleCreateCity} className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="الاسم العربي"
                  value={cityForm.name_ar}
                  onChange={(e) => setCityForm({...cityForm, name_ar: e.target.value})}
                  className="px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="الاسم الإنجليزي"
                  value={cityForm.name_en}
                  onChange={(e) => setCityForm({...cityForm, name_en: e.target.value})}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="الكود"
                  value={cityForm.code}
                  onChange={(e) => setCityForm({...cityForm, code: e.target.value})}
                  className="px-3 py-2 border rounded"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCity(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {cities.map((city) => (
              <div
                key={city.id}
                className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{city.name_ar}</span>
                  <span className="text-sm text-gray-500">({city.code})</span>
                </div>
                {city.name_en && (
                  <div className="text-sm text-gray-600">{city.name_en}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProvincesManagement
