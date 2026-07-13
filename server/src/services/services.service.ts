import { prisma } from "../config/database";

export async function listFactoryPartners() {
  const producers = await prisma.user.findMany({
    where: { role: "PRODUCER", producerProfile: { isNot: null } },
    select: {
      name: true,
      mobile: true,
      businessName: true,
      businessLocation: true,
      producerProfile: {
        select: {
          factoryType: true,
          productsMade: true,
          skuCount: true,
          established: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return producers.map((u) => ({
    name:        u.businessName ?? u.name,
    owner:       u.name,
    mobile:      u.mobile,
    location:    u.businessLocation ?? "",
    product:     u.producerProfile!.productsMade,
    items:       u.producerProfile!.skuCount,
    category:    u.producerProfile!.factoryType,
    since:       String(u.producerProfile!.established),
    description: u.producerProfile!.description ?? "",
  }));
}

export async function listFarmers() {
  const farmers = await prisma.user.findMany({
    where: { role: "PRODUCER", farmerProfile: { isNot: null } },
    select: {
      name: true,
      mobile: true,
      businessLocation: true,
      farmerProfile: {
        select: {
          crops: true,
          acres: true,
          organic: true,
          farmSince: true,
          village: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return farmers.map((u) => ({
    name:    u.name,
    mobile:  u.mobile,
    village: u.farmerProfile!.village ?? u.businessLocation ?? "",
    crop:    u.farmerProfile!.crops,
    acres:   u.farmerProfile!.acres,
    organic: u.farmerProfile!.organic,
    since:   String(u.farmerProfile!.farmSince),
  }));
}

export async function listDairyFarms() {
  const farms = await prisma.user.findMany({
    where: { role: "PRODUCER", producerProfile: { factoryType: "Dairy" } },
    select: {
      name: true,
      mobile: true,
      businessName: true,
      businessLocation: true,
      producerProfile: {
        select: {
          productsMade: true,
          cattleBreed: true,
          cowsCount: true,
          fssaiCertified: true,
          established: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return farms.map((u) => ({
    name:      u.businessName ?? u.name,
    mobile:    u.mobile,
    cows:      u.producerProfile!.cattleBreed ?? "N/A",
    location:  u.businessLocation ?? "",
    products:  u.producerProfile!.productsMade,
    certified: u.producerProfile!.fssaiCertified ?? false,
    cowsCount: u.producerProfile!.cowsCount ?? 0,
    since:     String(u.producerProfile!.established),
  }));
}

export async function listTurmericMills() {
  const mills = await prisma.user.findMany({
    where: { role: "PRODUCER", producerProfile: { factoryType: "Spice Mill" } },
    select: {
      name: true,
      businessName: true,
      businessLocation: true,
      producerProfile: {
        select: {
          established: true,
          grindingMethod: true,
          curcuminContent: true,
          millCapacity: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return mills.map((u) => ({
    name: u.businessName ?? u.name,
    location: u.businessLocation ?? "",
    method: u.producerProfile!.grindingMethod ?? "N/A",
    curcumin: u.producerProfile!.curcuminContent ?? "N/A",
    since: String(u.producerProfile!.established),
    capacity: u.producerProfile!.millCapacity ?? "N/A",
  }));
}

export async function listDCHubs() {
  const dcs = await prisma.user.findMany({
    where: { role: "DC", dcProfile: { isNot: null } },
    select: {
      name: true,
      businessName: true,
      dcProfile: {
        select: {
          coverageAreas: true,
          operatingHours: true,
          riderCount: true,
          capacity: true,
          coldStorage: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return dcs.map((u) => ({
    name: u.businessName ?? u.name,
    area: u.dcProfile!.coverageAreas,
    slots: u.dcProfile!.operatingHours,
    bikes: u.dcProfile!.riderCount,
    orders: u.dcProfile!.capacity,
    temp: u.dcProfile!.coldStorage ?? "Ambient",
  }));
}
