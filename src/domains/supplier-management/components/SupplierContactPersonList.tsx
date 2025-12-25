import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchContactPersonsBySupplierId, deleteContactPerson } from '../store/supplierSlice';
import { SupplierContactPerson } from '../types';
import SupplierContactPersonForm from './SupplierContactPersonForm';

interface SupplierContactPersonListProps {
  supplierId: string; // Assuming supplierId is passed to this component
}

const SupplierContactPersonList: React.FC<SupplierContactPersonListProps> = ({ supplierId }) => {
  const dispatch: AppDispatch = useDispatch();
  const { contactPersons, loading, error } = useSelector((state: RootState) => state.supplier);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContactPerson, setSelectedContactPerson] = useState<SupplierContactPerson | null>(null);

  useEffect(() => {
    if (supplierId) {
      dispatch(fetchContactPersonsBySupplierId(Number(supplierId)));
    }
  }, [dispatch, supplierId]);

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف جهة الاتصال هذه؟')) {
      await dispatch(deleteContactPerson(id));
      dispatch(fetchContactPersonsBySupplierId(Number(supplierId)));
    }
  };

  const handleAddClick = () => {
    setSelectedContactPerson(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (person: SupplierContactPerson) => {
    setSelectedContactPerson(person);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedContactPerson(null);
    dispatch(fetchContactPersonsBySupplierId(Number(supplierId)));
  };

  if (loading) return <div>تحميل جهات الاتصال...</div>;
  if (error) return <div>خطأ: {error}</div>;

  return (
    <div className="supplier-contact-person-list">
      <h3>جهات الاتصال</h3>
      {contactPersons.length === 0 ? (
        <p>لا توجد جهات اتصال لهذا المورد.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>الاسم الأول</th>
              <th>اسم العائلة</th>
              <th>البريد الإلكتروني</th>
              <th>رقم الهاتف</th>
              <th>المنصب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {contactPersons.map((person: SupplierContactPerson) => (
              <tr key={person.id}>
                <td>{person.first_name}</td>
                <td>{person.last_name}</td>
                <td>{person.email}</td>
                <td>{person.phone_number}</td>
                <td>{person.position}</td>
                <td>
                  <button className="btn btn-sm btn-info me-2" onClick={() => handleEditClick(person)}>تعديل</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(person.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="btn btn-primary mt-3" onClick={handleAddClick}>إضافة جهة اتصال جديدة</button>

      <SupplierContactPersonForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        supplierId={Number(supplierId)}
        contactPerson={selectedContactPerson}
      />
    </div>
  );
};

export default SupplierContactPersonList; 