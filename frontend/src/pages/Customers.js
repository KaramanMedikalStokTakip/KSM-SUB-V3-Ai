import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { getAllCustomers, searchCustomers, createCustomer, deleteCustomer, updateCustomer } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const data = await getAllCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchCustomers(searchQuery);
      setFilteredCustomers(data);
    } catch (error) {
      toast.error('Arama başarısız');
      setFilteredCustomers(customers);
    } finally {
      setIsSearching(false);
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(formData);
      toast.success('Müşteri eklendi');
      fetchCustomers();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('İşlem başarısız: ' + error.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(selectedCustomer.id, editFormData);
      toast.success('Müşteri bilgileri güncellendi');
      fetchCustomers();
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast.error('Güncelleme başarısız: ' + error.message);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteCustomer(customerId);
      toast.success('Müşteri silindi');
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-4xl font-bold text-gray-800">Müşteri Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-customer-btn">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Müşteri
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="customer-name-input"
                />
              </div>
              <div>
                <Label>Telefon *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="customer-phone-input"
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="customer-email-input"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="customer-address-input"
                  placeholder="Müşteri adresi"
                />
              </div>
              <div>
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="customer-notes-input"
                  placeholder="Notlar"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-customer-btn">Ekle</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="İsim veya telefon numarası ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              data-testid="customer-search-input"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Temizle
              </Button>
            )}
          </div>
          {isSearching && (
            <p className="text-sm text-gray-500 mt-2">Aranıyor...</p>
          )}
          {searchQuery && filteredCustomers.length === 0 && !isSearching && (
            <p className="text-sm text-gray-500 mt-2">Sonuç bulunamadı</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="card-hover" data-testid={`customer-card-${customer.id}`}>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{customer.name}</h3>
              <p className="text-sm text-gray-600 mb-1">📞 {customer.phone}</p>
              {customer.email && <p className="text-sm text-gray-600 mb-1">✉️ {customer.email}</p>}
              {customer.created_at && (
                <p className="text-xs text-gray-400 mb-3">
                  📅 {new Date(customer.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {customer.notes && (
                <p className="text-sm text-gray-500 mt-3 italic">"{customer.notes}"</p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => openEditDialog(customer)}
                  data-testid={`edit-customer-${customer.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bilgileri Düzenle
                </Button>
                {user?.role === 'yönetici' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(customer.id)}
                    data-testid={`delete-customer-${customer.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Ad Soyad *</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                data-testid="edit-customer-name-input"
              />
            </div>
            <div>
              <Label>Telefon *</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                required
                data-testid="edit-customer-phone-input"
              />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                data-testid="edit-customer-email-input"
              />
            </div>
            <div>
              <Label>Adres</Label>
              <Textarea
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                data-testid="edit-customer-address-input"
                placeholder="Müşteri adresi"
              />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                data-testid="edit-customer-notes-input"
                placeholder="Notlar"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" data-testid="update-customer-btn">
                Güncelle
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Customers;