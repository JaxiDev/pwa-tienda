// Configuración de API
// Detectar la URL del API automáticamente
const API_BASE_URL =
  "https://app-tiendaucq-env.eba-w3s5zsy2.us-east-1.elasticbeanstalk.com/api";

// Función genérica para hacer peticiones
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);

    // Manejar respuestas sin contenido (204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Intentar leer el cuerpo como JSON
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      // Manejar errores con más detalle
      const errorMessage =
        data.message || `Error: ${response.status} - ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status; // Guardar status para manejo específico (ej: 401, 409)
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ===================================
// 🔑 AUTENTICACIÓN
// ===================================
const AuthAPI = {
  login: async (email, password) => {
    return apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name, email, password, role = "REPARTIDOR") => {
    return apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  logout: async () => {
    // Si tu backend tiene endpoint de logout, úsalo. Si es stateless (JWT), esto es opcional.
    // return apiCall('/auth/logout', { method: 'POST' });
    return Promise.resolve(); // Simulado para frontend
  },
};

// ===================================
// 📦 PRODUCTOS
// ===================================
const ProductAPI = {
  list: async () => {
    return apiCall("/products");
  },

  getById: async (id) => {
    return apiCall(`/products/${id}`);
  },

  create: async (product) => {
    return apiCall("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  update: async (id, product) => {
    return apiCall(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },

  delete: async (id) => {
    return apiCall(`/products/${id}`, {
      method: "DELETE",
    });
  },
};

// ===================================
// 🧑 USUARIOS (Repartidores)
// ===================================
const UserAPI = {
  list: async () => {
    return apiCall("/users");
  },

  getById: async (id) => {
    return apiCall(`/users/${id}`);
  },

  create: async (user) => {
    return apiCall("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  update: async (id, user) => {
    return apiCall(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  },

  assignStore: async (userId, storeId) => {
    return apiCall(`/users/${userId}/assign-store/${storeId}`, {
      method: "POST",
    });
  },

  delete: async (id) => {
    return apiCall(`/users/${id}`, {
      method: "DELETE",
    });
  },

  saveFcmToken: async (userId, token) => {
    return apiCall(`/users/${userId}/fcm-token`, {
      method: "POST",
      body: token, // Sending raw string as body, handled in backend
    });
  },
};

// ===================================
// 🏢 TIENDAS
// ===================================
const StoreAPI = {
  list: async () => {
    return apiCall("/stores");
  },

  create: async (store) => {
    return apiCall("/stores", {
      method: "POST",
      body: JSON.stringify(store),
    });
  },

  update: async (id, store) => {
    // Ajustado para recibir ID explícito si es necesario
    // Si tu backend usa PUT /api/stores (sin ID en URL), usa la línea comentada abajo
    // return apiCall('/stores', { method: 'PUT', body: JSON.stringify(store) });

    // Si usa PUT /api/stores/{id}
    return apiCall(`/stores/${id}`, {
      // Asegúrate que tu backend soporte esto, o cambia a la opción de arriba
      method: "PUT",
      body: JSON.stringify(store),
    });
  },

  delete: async (id) => {
    return apiCall(`/stores/${id}`, {
      method: "DELETE",
    });
  },
};

// ===================================
// 🛒 ÓRDENES / PEDIDOS
// ===================================
const OrderAPI = {
  list: async () => {
    return apiCall("/orders");
  },

  create: async (order) => {
    return apiCall("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  update: async (id, order) => {
    return apiCall(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  },

  delete: async (id) => {
    return apiCall(`/orders/${id}`, {
      method: "DELETE",
    });
  },
};

// ===================================
// 📍 VISITAS
// ===================================
const VisitAPI = {
  list: async () => {
    return apiCall("/visits");
  },

  findByRepartidor: async (id) => {
    return apiCall(`/visits/by-repartidor/${id}`);
  },

  registerScan: async (
    storeCode,
    repartidorId,
    lat,
    lng,
    hadOrder = false,
    temporary = false
  ) => {
    const queryParams = new URLSearchParams({
      storeCode: storeCode,
      repartidorId: repartidorId,
      lat: lat,
      lng: lng,
      hadOrder: hadOrder,
      temporary: temporary,
    }).toString();

    return apiCall(`/visits/scan?${queryParams}`, {
      method: "POST",
    });
  },
};

// ===================================
// 🔔 NOTIFICACIONES
// ===================================
const NotificationAPI = {
  list: async () => {
    return apiCall("/notifications");
  },
};

// ===================================
// 🗓️ ASIGNACIONES TEMPORALES
// ===================================
const TemporaryAssignmentAPI = {
  assign: async (storeId, repartidorId, date) => {
    const queryParams = new URLSearchParams({
      storeId: storeId,
      repartidorId: repartidorId,
      date: date,
    }).toString();

    return apiCall(`/temporary-assignments?${queryParams}`, {
      method: "POST",
    });
  },
};
