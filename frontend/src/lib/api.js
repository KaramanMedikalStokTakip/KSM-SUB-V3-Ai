import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

// ============================================
// AUTH FUNCTIONS
// ============================================

export const loginUser = async (username, password) => {
  try {
    // First, try RPC function (if it exists in Supabase)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('verify_user_password', {
        p_username: username,
        p_password: password
      });

    // If RPC works, use it
    if (!rpcError && rpcData && rpcData.length > 0) {
      const result = rpcData[0];
      if (result.password_match) {
        const { password_match, ...userWithoutPassword } = result;
        return userWithoutPassword;
      }
      throw new Error('Kullanıcı adı veya şifre hatalı');
    }

    // Fallback: If RPC doesn't work, use direct query with bcrypt
    console.log('RPC failed, using fallback method:', rpcError?.message || 'RPC not available');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password, role, created_at')
      .eq('username', username)
      .single();

    if (error || !user) {
      throw new Error('Kullanıcı adı veya şifre hatalı');
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      throw new Error('Kullanıcı adı veya şifre hatalı');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
    
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

export const registerUser = async (username, email, password, role = 'depo') => {
  // Hash password using bcrypt.js
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        role
      }
    ])
    .select('id, username, email, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    throw new Error('Kayıt başarısız: ' + error.message);
  }

  return data;
};

// ============================================
// USERS FUNCTIONS
// ============================================

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateUser = async (userId, updates) => {
  const updateData = {};
  
  if (updates.username) updateData.username = updates.username;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.role) updateData.role = updates.role;
  if (updates.password) {
    // Hash password using bcrypt.js
    updateData.password = await bcrypt.hash(updates.password, 10);
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, username, email, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    throw new Error('Güncelleme hatası: ' + error.message);
  }

  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return { message: 'Kullanıcı silindi' };
};

// ============================================
// PRODUCTS FUNCTIONS
// ============================================

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const getProductByBarcode = async (barcode, branch = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode);
  
  // Eğer branch belirtilmişse, sadece o şubeyi filtrele
  if (branch) {
    query = query.eq('branch', branch);
  }
  
  const { data, error } = await query;

  if (error) throw new Error('Ürün bulunamadı');
  if (!data || data.length === 0) throw new Error('Ürün bulunamadı');
  
  // Eğer tek sonuç varsa direkt döndür
  if (data.length === 1) {
    return data[0];
  }
  
  // Birden fazla sonuç varsa (farklı şubelerde aynı barkod)
  return { multiple: true, products: data };
};

export const getLowStockProducts = async () => {
  // Supabase doesn't support column-to-column comparison in filters
  // So we fetch all products and filter in JavaScript
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('quantity', { ascending: true });

  if (error) throw error;
  
  // Filter products where quantity <= min_quantity
  return data.filter(product => product.quantity <= product.min_quantity);
};

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Bu barkod zaten mevcut');
    throw error;
  }

  return data;
};

export const updateProduct = async (productId, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (productId) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
  return { message: 'Ürün silindi' };
};

export const getProductFilters = async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select('brand, category');

  if (error) throw error;

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  return { brands, categories };
};

// ============================================
// BULK PRICE UPDATE FUNCTIONS
// ============================================

/**
 * Preview bulk price update - Shows what will be updated without actually updating
 * @param {Object} filters - { category, brand }
 * @param {string} priceType - 'purchase' | 'sale' | 'both'
 * @param {number} percentageChange - Percentage to change (positive for increase, negative for decrease)
 * @returns {Object} - { affectedCount, examples, filters }
 */
export const previewBulkPriceUpdate = async (filters, priceType, percentageChange) => {
  try {
    let query = supabase.from('products').select('*');

    // Apply filters
    if (filters.category && filters.category !== '') {
      query = query.eq('category', filters.category);
    }
    if (filters.brand && filters.brand !== '') {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    const multiplier = 1 + (percentageChange / 100);
    
    // Calculate examples (first 5 products)
    const examples = products.slice(0, 5).map(product => {
      const result = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
      };

      if (priceType === 'purchase' || priceType === 'both') {
        result.old_purchase_price = product.purchase_price;
        result.new_purchase_price = parseFloat((product.purchase_price * multiplier).toFixed(2));
      }

      if (priceType === 'sale' || priceType === 'both') {
        result.old_sale_price = product.sale_price;
        result.new_sale_price = parseFloat((product.sale_price * multiplier).toFixed(2));
      }

      return result;
    });

    return {
      affectedCount: products.length,
      examples,
      filters,
      priceType,
      percentageChange
    };
  } catch (error) {
    console.error('Preview error:', error);
    throw error;
  }
};

/**
 * Bulk update product prices
 * @param {Object} filters - { category, brand }
 * @param {string} priceType - 'purchase' | 'sale' | 'both'
 * @param {number} percentageChange - Percentage to change (positive for increase, negative for decrease)
 * @returns {Object} - { updatedCount, message }
 */
export const bulkUpdateProductPrices = async (filters, priceType, percentageChange) => {
  try {
    // First, get all products that match the filters
    let query = supabase.from('products').select('*');

    // Apply filters
    if (filters.category && filters.category !== '') {
      query = query.eq('category', filters.category);
    }
    if (filters.brand && filters.brand !== '') {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!products || products.length === 0) {
      throw new Error('Filtre kriterlerine uygun ürün bulunamadı');
    }

    const multiplier = 1 + (percentageChange / 100);
    let updatedCount = 0;

    // Update each product
    for (const product of products) {
      const updates = {};

      if (priceType === 'purchase' || priceType === 'both') {
        updates.purchase_price = parseFloat((product.purchase_price * multiplier).toFixed(2));
      }

      if (priceType === 'sale' || priceType === 'both') {
        updates.sale_price = parseFloat((product.sale_price * multiplier).toFixed(2));
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    return {
      updatedCount,
      message: `${updatedCount} ürünün fiyatı başarıyla güncellendi`
    };
  } catch (error) {
    console.error('Bulk update error:', error);
    throw error;
  }
};

// ============================================
// CUSTOMERS FUNCTIONS
// ============================================

export const getAllCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('deleted', false)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const searchCustomers = async (query) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('deleted', false)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data;
};

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCustomer = async (customerId, updates) => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCustomer = async (customerId) => {
  // Soft delete
  const { data, error } = await supabase
    .from('customers')
    .update({ deleted: true })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return { message: 'Müşteri silindi' };
};

export const getCustomerPurchases = async (customerId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

// ============================================
// SALES FUNCTIONS
// ============================================

export const getAllSales = async (startDate = null, endDate = null) => {
  let query = supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSale = async (saleData) => {
  const { data, error } = await supabase
    .from('sales')
    .insert([saleData])
    .select()
    .single();

  if (error) throw error;

  // Update product quantities
  for (const item of saleData.items) {
    const { error: updateError } = await supabase.rpc('decrement_product_quantity', {
      product_id: item.product_id,
      quantity_to_subtract: item.quantity
    });
    
    // If RPC doesn't exist, use regular update
    if (updateError) {
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();
      
      await supabase
        .from('products')
        .update({ quantity: product.quantity - item.quantity })
        .eq('id', item.product_id);
    }
  }

  // Update customer total_spent
  if (saleData.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', saleData.customer_id)
      .single();
    
    await supabase
      .from('customers')
      .update({ total_spent: (customer?.total_spent || 0) + saleData.final_amount })
      .eq('id', saleData.customer_id);
  }

  return data;
};

// ============================================
// CALENDAR EVENTS FUNCTIONS
// ============================================

export const getCalendarEvents = async (userId, startDate = null, endDate = null) => {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (startDate && endDate) {
    query = query
      .gte('date', startDate)
      .lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createCalendarEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCalendarEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCalendarEvent = async (eventId) => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
  return { message: 'Etkinlik silindi' };
};

// ============================================
// REPORTS FUNCTIONS
// ============================================

export const getDashboardStats = async () => {
  // Get total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Get low stock count (fetch all and filter in JS since Supabase doesn't support column comparison)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, quantity, min_quantity');
  
  const lowStockProducts = allProducts?.filter(p => p.quantity <= p.min_quantity) || [];

  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todaySales } = await supabase
    .from('sales')
    .select('final_amount')
    .gte('created_at', today.toISOString());

  // Get week sales
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekSales } = await supabase
    .from('sales')
    .select('final_amount')
    .gte('created_at', weekAgo.toISOString());

  const todayRevenue = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0) || 0;
  const weekRevenue = weekSales?.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0) || 0;

  return {
    total_products: totalProducts || 0,
    low_stock_count: lowStockProducts?.length || 0,
    today_sales_count: todaySales?.length || 0,
    today_revenue: todayRevenue,
    week_sales_count: weekSales?.length || 0,
    week_revenue: weekRevenue
  };
};

export const getStockReport = async (brand = null, category = null) => {
  let query = supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (brand) query = query.ilike('brand', `%${brand}%`);
  if (category) query = query.ilike('category', `%${category}%`);

  const { data: products, error } = await query;
  if (error) throw error;

  const reportData = products.map(product => ({
    name: product.name,
    barcode: product.barcode,
    brand: product.brand,
    category: product.category,
    quantity: product.quantity,
    unit_type: product.unit_type || 'adet',
    min_quantity: product.min_quantity,
    purchase_price: product.purchase_price,
    sale_price: product.sale_price,
    stock_value: product.quantity * product.purchase_price,
    status: product.quantity <= product.min_quantity ? 'Düşük Stok' : 'Normal'
  }));

  const totalValue = reportData.reduce((sum, item) => sum + item.stock_value, 0);
  const totalItems = reportData.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: reportData,
    summary: {
      total_products: reportData.length,
      total_items: totalItems,
      total_value: Math.round(totalValue * 100) / 100,
      filters_applied: { brand, category }
    }
  };
};

export const getTopSellingProducts = async (startDate, endDate, limit = 10) => {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('items')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  // Aggregate product sales
  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = {
          _id: item.product_id,
          product_name: item.name,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      productSales[item.product_id].total_quantity += item.quantity;
      productSales[item.product_id].total_revenue += item.total;
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
};

export const getTopProfitProducts = async (startDate, endDate, limit = 10) => {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('items')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  // Get all products for purchase price lookup
  const { data: products } = await supabase
    .from('products')
    .select('id, purchase_price');

  const productPriceMap = {};
  products.forEach(p => {
    productPriceMap[p.id] = p.purchase_price;
  });

  // Calculate profits
  const productProfits = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const purchasePrice = productPriceMap[item.product_id] || 0;
      const profit = (item.price - purchasePrice) * item.quantity;

      if (!productProfits[item.product_id]) {
        productProfits[item.product_id] = {
          product_id: item.product_id,
          product_name: item.name,
          total_profit: 0,
          total_quantity: 0
        };
      }
      productProfits[item.product_id].total_profit += profit;
      productProfits[item.product_id].total_quantity += item.quantity;
    });
  });

  return Object.values(productProfits)
    .sort((a, b) => b.total_profit - a.total_profit)
    .slice(0, limit);
};

// ============================================
// CURRENCY API (External)
// ============================================

export const getCurrencyRates = async () => {
  try {
    // Get currency rates from GenelPara API
    const response = await fetch('https://api.genelpara.com/json/?list=doviz&sembol=all');
    const data = await response.json();

    if (!response.ok || !data) {
      throw new Error('API yanıt hatası');
    }

    // Parse the API response
    const usd = data.find(item => item.sembol === 'USD');
    const eur = data.find(item => item.sembol === 'EUR');
    const gold = data.find(item => item.sembol === 'ONS' || item.sembol === 'GA'); // Altın (Ons veya Gram Altın)
    const silver = data.find(item => item.sembol === 'GUMUS');
    const oil = data.find(item => item.sembol === 'BRENT'); // Brent Petrol
    const btc = data.find(item => item.sembol === 'BTC');
    const eth = data.find(item => item.sembol === 'ETH');

    return {
      usd_try: usd ? parseFloat(usd.satis) : 35.50,
      eur_try: eur ? parseFloat(eur.satis) : 38.20,
      gold_try: gold ? parseFloat(gold.satis) : 2800.0,
      silver_try: silver ? parseFloat(silver.satis) : 32.5,
      oil_try: oil ? parseFloat(oil.satis) : 85.0,
      btc_try: btc ? parseFloat(btc.satis) : 3500000,
      eth_try: eth ? parseFloat(eth.satis) : 125000,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Kur bilgisi hatası:', error);
    // Fallback values
    return {
      usd_try: 35.50,
      eur_try: 38.20,
      gold_try: 2800.0,
      silver_try: 32.5,
      oil_try: 85.0,
      btc_try: 3500000,
      eth_try: 125000,
      timestamp: new Date().toISOString()
    };
  }
};


// ============================================
// AI DESCRIPTION GENERATION (VIA BACKEND)
// ============================================

// Import Gemini AI utility
import { generateProductDescription as generateWithGemini } from './gemini';

export const generateProductDescription = async (productName, brand, category) => {
  try {
    return await generateWithGemini(productName, brand, category);
  } catch (error) {
    console.error('AI açıklama hatası:', error);
    throw new Error('AI açıklama oluşturulamadı: ' + error.message);
  }
};

// ============================================
// METAL PRICE API (GOLD & SILVER PRICES)
// ============================================

export const getMetalPrices = async () => {
  try {
    // MetalpriceAPI - Free tier: 100 requests/month
    const response = await fetch(
      'https://api.metalpriceapi.com/v1/latest?api_key=free&base=TRY&currencies=XAU,XAG'
    );

    if (!response.ok) {
      throw new Error('Metal fiyat API hatası');
    }

    const data = await response.json();
    
    // Check if data and rates exist
    if (!data || !data.rates || !data.rates.XAU || !data.rates.XAG) {
      console.warn('Metal price API returned invalid data, using fallback');
      throw new Error('Invalid API response');
    }
    
    // XAU = Gold (per troy ounce)
    // XAG = Silver (per troy ounce)
    // Convert to grams (1 troy oz = 31.1035 grams)
    
    const goldPerOunce = 1 / data.rates.XAU;
    const silverPerOunce = 1 / data.rates.XAG;
    
    const goldPerGram = Math.round((goldPerOunce / 31.1035) * 100) / 100;
    const silverPerGram = Math.round((silverPerOunce / 31.1035) * 100) / 100;

    return {
      gold_try: goldPerGram,
      silver_try: silverPerGram,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Metal fiyat hatası:', error);
    // Fallback values (realistic prices for Turkey as of 2025)
    return {
      gold_try: 2800.0,
      silver_try: 32.5,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================
// PRICE COMPARISON (SIMPLE IMPLEMENTATION)
// ============================================

export const comparePrices = async (productName, brand) => {
  try {
    // For a free solution, we'll use a simple approach
    // In production, this could use SerpAPI or similar services
    
    // Simulate price comparison from different sources
    const searchQuery = `${brand ? brand + ' ' : ''}${productName}`;
    
    // Mock data for demonstration
    // In production, replace with real API calls
    const mockResults = [
      {
        title: `${productName} - Online Medikal Market`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Online Medikal Market'
      },
      {
        title: `${productName} - Sağlık Ürünleri`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Sağlık Ürünleri'
      },
      {
        title: `${productName} - Medikal Store`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Medikal Store'
      }
    ].sort((a, b) => a.price - b.price);

    return {
      success: true,
      result_count: mockResults.length,
      price_results: mockResults,
      search_query: searchQuery
    };
  } catch (error) {
    console.error('Fiyat karşılaştırma hatası:', error);
    return {
      success: false,
      error: 'Fiyat karşılaştırması yapılamadı',
      result_count: 0,
      price_results: []
    };
  }
};
