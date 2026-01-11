import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getProductFilters, getTopSellingProducts, getTopProfitProducts, getStockReport } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Label } from '../components/ui/label';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topSelling, setTopSelling] = useState([]);
  const [topProfit, setTopProfit] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Stok raporu için state'ler
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockReport, setStockReport] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);

  useEffect(() => {
    fetchFilters();
    loadReportHistory();
    loadSavedReports();
  }, []);

  const fetchFilters = async () => {
    try {
      const data = await getProductFilters();
      setBrands(data.brands);
      setCategories(data.categories);
    } catch (error) {
      console.error('Filtreler yüklenemedi', error);
    }
  };

  const loadReportHistory = () => {
    try {
      const history = localStorage.getItem('reportHistory');
      if (history) {
        setReportHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Rapor geçmişi yüklenemedi', error);
    }
  };

  const loadSavedReports = () => {
    try {
      const savedStock = localStorage.getItem('savedStockReport');
      const savedSelling = localStorage.getItem('savedTopSelling');
      const savedProfit = localStorage.getItem('savedTopProfit');
      
      if (savedStock) setStockReport(JSON.parse(savedStock));
      if (savedSelling) {
        const sellingData = JSON.parse(savedSelling);
        // Yeni format kontrolü - eğer data property varsa yeni format
        if (sellingData.data) {
          setTopSelling(sellingData.data);
        } else {
          // Eski format - direkt array
          setTopSelling(sellingData);
        }
      }
      if (savedProfit) {
        const profitData = JSON.parse(savedProfit);
        // Yeni format kontrolü - eğer data property varsa yeni format
        if (profitData.data) {
          setTopProfit(profitData.data);
        } else {
          // Eski format - direkt array
          setTopProfit(profitData);
        }
      }
    } catch (error) {
      console.error('Kaydedilmiş raporlar yüklenemedi', error);
    }
  };
  const deleteReportFromHistory = (id) => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      const updatedHistory = reportHistory.filter(report => report.id !== id);
      setReportHistory(updatedHistory);
      localStorage.setItem('reportHistory', JSON.stringify(updatedHistory));
      toast.success('Rapor geçmişten silindi');
    }
  };

  const clearStockReport = () => {
    if (window.confirm('Stok raporunu temizlemek istediğinizden emin misiniz?')) {
      setStockReport(null);
      localStorage.removeItem('savedStockReport');
      toast.success('Stok raporu temizlendi');
    }
  };

  const clearTopSelling = () => {
    if (window.confirm('En çok satanlar raporunu temizlemek istediğinizden emin misiniz?')) {
      setTopSelling([]);
      localStorage.removeItem('savedTopSelling');
      localStorage.removeItem('savedTopSellingMeta');
      toast.success('Rapor temizlendi');
    }
  };

  const clearTopProfit = () => {
    if (window.confirm('En karlılar raporunu temizlemek istediğinizden emin misiniz?')) {
      setTopProfit([]);
      localStorage.removeItem('savedTopProfit');
      localStorage.removeItem('savedTopProfitMeta');
      toast.success('Rapor temizlendi');
    }
  };

  const fetchTopSelling = async () => {
    if (!startDate || !endDate) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }

    setLoading(true);
    try {
      const data = await getTopSellingProducts(startDate, endDate, 10);
      
      // Tarih ve saat bilgisi ile rapor objesi oluştur
      const reportWithMeta = {
        data: data,
        createdAt: new Date().toISOString(),
        createdDate: new Date().toLocaleDateString('tr-TR'),
        createdTime: new Date().toLocaleTimeString('tr-TR'),
        dateRange: `${startDate} - ${endDate}`
      };
      
      setTopSelling(data);
      
      // localStorage'a kaydet
      localStorage.setItem('savedTopSelling', JSON.stringify(reportWithMeta));
      localStorage.setItem('savedTopSellingMeta', JSON.stringify({
        createdDate: reportWithMeta.createdDate,
        createdTime: reportWithMeta.createdTime,
        dateRange: reportWithMeta.dateRange
      }));
      
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProfit = async () => {
    if (!startDate || !endDate) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }

    setLoading(true);
    try {
      const data = await getTopProfitProducts(startDate, endDate, 10);
      
      // Tarih ve saat bilgisi ile rapor objesi oluştur
      const reportWithMeta = {
        data: data,
        createdAt: new Date().toISOString(),
        createdDate: new Date().toLocaleDateString('tr-TR'),
        createdTime: new Date().toLocaleTimeString('tr-TR'),
        dateRange: `${startDate} - ${endDate}`
      };
      
      setTopProfit(data);
      
      localStorage.setItem('savedTopProfit', JSON.stringify(reportWithMeta));
      localStorage.setItem('savedTopProfitMeta', JSON.stringify({
        createdDate: reportWithMeta.createdDate,
        createdTime: reportWithMeta.createdTime,
        dateRange: reportWithMeta.dateRange
      }));
      
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const data = await getStockReport(selectedBrand || null, selectedCategory || null);
      
      // Tarih ve saat bilgisi ekle
      const reportWithTimestamp = {
        ...data,
        createdAt: new Date().toISOString(),
        createdDate: new Date().toLocaleDateString('tr-TR'),
        createdTime: new Date().toLocaleTimeString('tr-TR')
      };
      
      setStockReport(reportWithTimestamp);
      
      // localStorage'a kaydet
      localStorage.setItem('savedStockReport', JSON.stringify(reportWithTimestamp));
      
      toast.success('Stok raporu oluşturuldu');
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data, filename) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success('Excel raporu indirildi');
    } catch (error) {
      toast.error('Excel dışa aktarma başarısız');
    }
  };

  // Türkçe karakterleri PDF uyumlu hale getir
  const turkishToPdfText = (text) => {
    if (typeof text !== 'string') return text;
    
    const turkishMap = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, char => turkishMap[char] || char);
  };

  const exportToPDF = (data, filename, title) => {
    try {
      if (!data || data.length === 0) {
        toast.error('Dışa aktarılacak veri bulunamadı');
        return;
      }

      const doc = new jsPDF();
      
      // Başlık ekle
      doc.setFontSize(16);
      doc.text(turkishToPdfText(title), 14, 15);
      
      // Tarih bilgisi
      doc.setFontSize(10);
      doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 25);
      
      // Tablo oluştur - Türkçe karakterleri dönüştür
      const headers = Object.keys(data[0] || {}).map(h => turkishToPdfText(h));
      const rows = data.map(item => 
        Object.values(item).map(val => turkishToPdfText(String(val)))
      );
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { font: 'helvetica', fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      doc.save(`${filename}.pdf`);
      toast.success('PDF raporu indirildi');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`PDF dışa aktarma başarısız: ${error.message}`);
    }
  };

  const exportToTxt = (data, filename, title) => {
    try {
      if (!data || data.length === 0) {
        toast.error('Dışa aktarılacak veri bulunamadı');
        return;
      }

      let content = `${title}\n`;
      content += `Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n`;
      content += '='.repeat(50) + '\n\n';
      
      data.forEach((item, idx) => {
        content += `${idx + 1}. Kayıt:\n`;
        Object.entries(item).forEach(([key, value]) => {
          content += `  ${key}: ${value}\n`;
        });
        content += '\n';
      });
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${filename}.txt`);
      toast.success('TXT raporu indirildi');
    } catch (error) {
      console.error('TXT export error:', error);
      toast.error(`TXT dışa aktarma başarısız: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <h1 className="text-4xl font-bold text-gray-800">Raporlar</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tarih Aralığı Seçin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600">Başlangıç Tarihi</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-date-input"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600">Bitiş Tarihi</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="end-date-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-3 reports-tabs-list">
          <TabsTrigger value="stock" className="reports-tab-trigger">Stok Raporu</TabsTrigger>
          <TabsTrigger value="selling" className="reports-tab-trigger">En Çok Satanlar</TabsTrigger>
          <TabsTrigger value="profit" className="reports-tab-trigger">En Kârlılar</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtreleme Seçenekleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Marka</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button 
                onClick={fetchStockReport} 
                disabled={loading} 
                className="mt-4"
              >
                {loading ? 'Yükleniyor...' : 'Raporu Oluştur'}
              </Button>
            </CardContent>
          </Card>

          {stockReport && stockReport.products && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Stok Raporu Özeti</CardTitle>
                  {stockReport.createdDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      📅 Oluşturulma: {stockReport.createdDate} - {stockReport.createdTime}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearStockReport}
                  className="ml-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Ürün</p>
                    <p className="text-2xl font-bold text-blue-600">{stockReport.summary?.total_products || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Adet</p>
                    <p className="text-2xl font-bold text-green-600">{stockReport.summary?.total_items || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Değer</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(stockReport.summary?.total_value || 0)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(stockReport.products, 'stok-raporu')}
                    disabled={!stockReport.products || stockReport.products.length === 0}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToPDF(stockReport.products, 'stok-raporu', 'Stok Yönetim Raporu')}
                    disabled={!stockReport.products || stockReport.products.length === 0}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToTxt(stockReport.products, 'stok-raporu', 'Stok Yönetim Raporu')}
                    disabled={!stockReport.products || stockReport.products.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Ürün Adı</th>
                        <th className="p-2 text-left">Marka</th>
                        <th className="p-2 text-left">Kategori</th>
                        <th className="p-2 text-right">Stok</th>
                        <th className="p-2 text-right">Birim Fiyat</th>
                        <th className="p-2 text-right">Toplam Değer</th>
                        <th className="p-2 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockReport.products.map((product, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2">{product.name}</td>
                          <td className="p-2">{product.brand}</td>
                          <td className="p-2">{product.category}</td>
                          <td className="p-2 text-right">{product.quantity} {product.unit_type}</td>
                          <td className="p-2 text-right">{formatCurrency(product.purchase_price)}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(product.stock_value)}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.status === 'Düşük Stok' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="selling" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={fetchTopSelling} disabled={loading} data-testid="fetch-top-selling-btn">
              {loading ? 'Yükleniyor...' : 'Raporu Oluştur'}
            </Button>
            {topSelling.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(topSelling, 'en-cok-satanlar')} data-testid="export-selling-btn">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF(topSelling, 'en-cok-satanlar', 'En Çok Satan Ürünler Raporu')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToTxt(topSelling, 'en-cok-satanlar', 'En Çok Satan Ürünler Raporu')}>
                  <Download className="w-4 h-4 mr-2" />
                  TXT
                </Button>
                <Button variant="destructive" size="sm" onClick={clearTopSelling}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </>
            )}
          </div>

          {topSelling.length > 0 && (() => {
            const meta = localStorage.getItem('savedTopSellingMeta');
            const metaData = meta ? JSON.parse(meta) : null;
            return metaData && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                📅 Oluşturulma: {metaData.createdDate} - {metaData.createdTime} | 📊 Tarih Aralığı: {metaData.dateRange}
              </div>
            );
          })()}

          {topSelling.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topSelling}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_quantity" fill="#3b82f6" name="Satılan Adet" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-2">
                  {topSelling.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{idx + 1}. {item.product_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{item.total_quantity} adet</p>
                        <p className="text-sm text-gray-500">₺{item.total_revenue?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={fetchTopProfit} disabled={loading} data-testid="fetch-top-profit-btn">
              {loading ? 'Yükleniyor...' : 'Raporu Oluştur'}
            </Button>
            {topProfit.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(topProfit, 'en-karlilar')} data-testid="export-profit-btn">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF(topProfit, 'en-karlilar', 'En Karlı Ürünler Raporu')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToTxt(topProfit, 'en-karlilar', 'En Karlı Ürünler Raporu')}>
                  <Download className="w-4 h-4 mr-2" />
                  TXT
                </Button>
                <Button variant="destructive" size="sm" onClick={clearTopProfit}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </>
            )}
          </div>

          {topProfit.length > 0 && (() => {
            const meta = localStorage.getItem('savedTopProfitMeta');
            const metaData = meta ? JSON.parse(meta) : null;
            return metaData && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                📅 Oluşturulma: {metaData.createdDate} - {metaData.createdTime} | 📊 Tarih Aralığı: {metaData.dateRange}
              </div>
            );
          })()}

          {topProfit.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProfit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_profit" fill="#10b981" name="Toplam Kâr (₺)" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-2">
                  {topProfit.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{idx + 1}. {item.product_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₺{item.total_profit?.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{item.total_quantity} adet satıldı</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Reports;