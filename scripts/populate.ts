import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const sampleProducts = [
  {
    title: 'iPhone 14 Pro',
    description: 'Latest iPhone model with advanced camera system',
    price: 999
  },
  {
    title: 'MacBook Air M2',
    description: 'Lightweight laptop with Apple Silicon',
    price: 1199
  },
  {
    title: 'AirPods Pro',
    description: 'Wireless earbuds with active noise cancellation',
    price: 249
  },
  {
    title: 'iPad Air',
    description: '10.9-inch tablet with M1 chip',
    price: 599
  }
];

const createProduct = async (product: any) => {
  const productId = uuidv4();
  const command = new PutCommand({
    TableName: 'products',
    Item: {
      id: productId,
      title: product.title,
      description: product.description,
      price: product.price
    }
  });

  try {
    await docClient.send(command);
    return productId;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

const createStock = async (productId: string, count: number) => {
  const command = new PutCommand({
    TableName: 'stocks',
    Item: {
      product_id: productId,
      count: count
    }
  });

  try {
    await docClient.send(command);
  } catch (error) {
    console.error('Error creating stock:', error);
    throw error;
  }
};

const populateTables = async () => {
  console.log('Starting to populate tables...');

  for (const product of sampleProducts) {
    try {
      // Create product and get its ID
      const productId = await createProduct(product);
      console.log(`Created product: ${product.title} with ID: ${productId}`);

      // Create random stock count between 1 and 100
      const stockCount = Math.floor(Math.random() * 100) + 1;
      await createStock(productId, stockCount);
      console.log(`Created stock for product ${productId} with count: ${stockCount}`);
    } catch (error) {
      console.error('Error in population process:', error);
    }
  }

  console.log('Finished populating tables!');
};

populateTables().catch(console.error);
