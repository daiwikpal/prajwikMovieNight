'use server';

import { prisma } from '@/lib/prisma';

export async function getStreamingSites() {
  try {
    const sites = await prisma.streamingSite.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return sites;
  } catch (error) {
    console.error('Error fetching streaming sites:', error);
    return [];
  }
}

export async function addStreamingSite(data: { name: string; url: string; icon: string }) {
  try {
    const site = await prisma.streamingSite.create({
      data,
    });
    return site;
  } catch (error) {
    console.error('Error adding streaming site:', error);
    throw new Error('Failed to add site');
  }
}

export async function deleteStreamingSite(id: string) {
  try {
    await prisma.streamingSite.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting streaming site:', error);
    throw new Error('Failed to delete site');
  }
}
