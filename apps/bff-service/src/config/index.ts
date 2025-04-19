import dotenv from 'dotenv';

dotenv.config();

export interface ServiceConfig {
  [key: string]: string | undefined;
  product: string;
  cart: string;
}

export const config = {
  port: process.env.PORT || 3000,
  services: {
    product: process.env.PRODUCT_SERVICE_URL,
    cart: process.env.CART_SERVICE_URL,
  } as ServiceConfig,
};

export const validateConfig = () => {
  const { services } = config;
  
  for (const [service, url] of Object.entries(services)) {
    if (!url) {
      throw new Error(`Missing URL configuration for ${service} service`);
    }
  }
};