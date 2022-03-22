import Transaction from '../models/Transaction';
import fs from 'fs';
import csvParse from 'csv-parse';
import Category from '../models/Category';
import { getRepository, In } from 'typeorm';
interface CSVTransaction {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const transactions: CSVTransaction[] = [];

    const categories: string[] = [];

    const parseCSV = contactsReadStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || category) return;

      categories.push(category);

      transactions.push({ title, value, category, type });
    });
    await new Promise((resolve, reject) => parseCSV.on('end', resolve));

    const existenCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
  }
}

export default ImportTransactionsService;
