import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto';

// Default settings values
const DEFAULTS: Record<string, unknown> = {
  factoryName: 'Xuong Banh BANHNGON',
  factoryPhone: '0901000001',
  factoryAddress: 'TP. Ho Chi Minh',
  cutoffTime: '20:00',
  deliveryNote: 'Giao hang tu 6:00 - 12:00 sang',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all settings as a flat key-value map
   */
  async getAll(): Promise<Record<string, unknown>> {
    const settings = await this.prisma.setting.findMany();

    // Start with defaults, override with DB values
    const result: Record<string, unknown> = { ...DEFAULTS };
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }

  /**
   * Update multiple settings at once
   */
  async update(dto: UpdateSettingsDto): Promise<Record<string, unknown>> {
    const entries = Object.entries(dto).filter(
      ([, value]) => value !== undefined,
    );

    // Upsert each setting in a transaction
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: value as string },
          update: { value: value as string },
        }),
      ),
    );

    return this.getAll();
  }

  /**
   * Get a single setting by key
   */
  async getByKey(key: string): Promise<unknown> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    return setting?.value ?? DEFAULTS[key] ?? null;
  }
}
