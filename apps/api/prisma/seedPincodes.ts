import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Zone A — Metro cities
const ZONE_A_PINCODES = [
  // Mumbai
  {
    pincode: "400001",
    city: "Mumbai",
    district: "Mumbai",
    state: "Maharashtra",
  },
  {
    pincode: "400051",
    city: "Mumbai",
    district: "Mumbai",
    state: "Maharashtra",
  },
  {
    pincode: "400069",
    city: "Mumbai",
    district: "Mumbai",
    state: "Maharashtra",
  },
  // Delhi
  {
    pincode: "110001",
    city: "New Delhi",
    district: "Central Delhi",
    state: "Delhi",
  },
  {
    pincode: "110011",
    city: "New Delhi",
    district: "South Delhi",
    state: "Delhi",
  },
  {
    pincode: "110019",
    city: "New Delhi",
    district: "South Delhi",
    state: "Delhi",
  },
  // Bangalore
  {
    pincode: "560001",
    city: "Bangalore",
    district: "Bangalore Urban",
    state: "Karnataka",
  },
  {
    pincode: "560034",
    city: "Bangalore",
    district: "Bangalore Urban",
    state: "Karnataka",
  },
  // Chennai
  {
    pincode: "600001",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
  },
  {
    pincode: "600020",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
  },
  // Hyderabad
  {
    pincode: "500001",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
  },
  {
    pincode: "500016",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
  },
  // Pune
  { pincode: "411001", city: "Pune", district: "Pune", state: "Maharashtra" },
  { pincode: "411045", city: "Pune", district: "Pune", state: "Maharashtra" },
  // Kolkata
  {
    pincode: "700001",
    city: "Kolkata",
    district: "Kolkata",
    state: "West Bengal",
  },
  {
    pincode: "700019",
    city: "Kolkata",
    district: "Kolkata",
    state: "West Bengal",
  },
];

// Zone B — Tier-2 cities
const ZONE_B_PINCODES = [
  // Raipur
  {
    pincode: "492001",
    city: "Raipur",
    district: "Raipur",
    state: "Chhattisgarh",
  },
  {
    pincode: "492006",
    city: "Raipur",
    district: "Raipur",
    state: "Chhattisgarh",
  },
  {
    pincode: "492009",
    city: "Raipur",
    district: "Raipur",
    state: "Chhattisgarh",
  },
  // Jaipur
  { pincode: "302001", city: "Jaipur", district: "Jaipur", state: "Rajasthan" },
  { pincode: "302017", city: "Jaipur", district: "Jaipur", state: "Rajasthan" },
  // Lucknow
  {
    pincode: "226001",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
  },
  {
    pincode: "226010",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
  },
  // Nagpur
  {
    pincode: "440001",
    city: "Nagpur",
    district: "Nagpur",
    state: "Maharashtra",
  },
  // Indore
  {
    pincode: "452001",
    city: "Indore",
    district: "Indore",
    state: "Madhya Pradesh",
  },
  // Bhopal
  {
    pincode: "462001",
    city: "Bhopal",
    district: "Bhopal",
    state: "Madhya Pradesh",
  },
  // Patna
  { pincode: "800001", city: "Patna", district: "Patna", state: "Bihar" },
  // Chandigarh
  {
    pincode: "160001",
    city: "Chandigarh",
    district: "Chandigarh",
    state: "Chandigarh",
  },
  // Ahmedabad
  {
    pincode: "380001",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
  },
  {
    pincode: "380015",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
  },
  // Surat
  { pincode: "395001", city: "Surat", district: "Surat", state: "Gujarat" },
  // Coimbatore
  {
    pincode: "641001",
    city: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
  },
  // Kochi
  { pincode: "682001", city: "Kochi", district: "Ernakulam", state: "Kerala" },
  // Visakhapatnam
  {
    pincode: "530001",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
  },
];

// Zone C — General India
const ZONE_C_PINCODES = [
  {
    pincode: "110030",
    city: "Delhi",
    district: "South West Delhi",
    state: "Delhi",
  },
  {
    pincode: "201301",
    city: "Noida",
    district: "Gautam Buddh Nagar",
    state: "Uttar Pradesh",
  },
  {
    pincode: "122001",
    city: "Gurgaon",
    district: "Gurugram",
    state: "Haryana",
  },
  {
    pincode: "600083",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
  },
  {
    pincode: "380061",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
  },
  { pincode: "800002", city: "Patna", district: "Patna", state: "Bihar" },
  {
    pincode: "751001",
    city: "Bhubaneswar",
    district: "Khurda",
    state: "Odisha",
  },
  {
    pincode: "641002",
    city: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
  },
  { pincode: "576101", city: "Udupi", district: "Udupi", state: "Karnataka" },
  {
    pincode: "695001",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    state: "Kerala",
  },
  {
    pincode: "248001",
    city: "Dehradun",
    district: "Dehradun",
    state: "Uttarakhand",
  },
  { pincode: "781001", city: "Guwahati", district: "Kamrup", state: "Assam" },
  { pincode: "834001", city: "Ranchi", district: "Ranchi", state: "Jharkhand" },
  {
    pincode: "361001",
    city: "Jamnagar",
    district: "Jamnagar",
    state: "Gujarat",
  },
  {
    pincode: "560100",
    city: "Bangalore",
    district: "Bangalore Rural",
    state: "Karnataka",
  },
];

// Zone X — Not serviceable
const ZONE_X_PINCODES = [
  { pincode: "193401", city: "Leh", district: "Leh", state: "Ladakh" },
  { pincode: "194101", city: "Kargil", district: "Kargil", state: "Ladakh" },
  {
    pincode: "744101",
    city: "Port Blair",
    district: "South Andaman",
    state: "Andaman and Nicobar Islands",
  },
  {
    pincode: "682553",
    city: "Lakshadweep",
    district: "Lakshadweep",
    state: "Lakshadweep",
  },
];

async function main() {
  console.log("🌱 Seeding pincodes...");

  // Upsert all zones
  for (const p of ZONE_A_PINCODES) {
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: { zone: "A", isServiceable: true },
      create: { ...p, zone: "A", isServiceable: true },
    });
  }

  for (const p of ZONE_B_PINCODES) {
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: { zone: "B", isServiceable: true },
      create: { ...p, zone: "B", isServiceable: true },
    });
  }

  for (const p of ZONE_C_PINCODES) {
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: { zone: "C", isServiceable: true },
      create: { ...p, zone: "C", isServiceable: true },
    });
  }

  for (const p of ZONE_X_PINCODES) {
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: { zone: "X", isServiceable: false },
      create: { ...p, zone: "X", isServiceable: false },
    });
  }

  console.log(
    `✅ Seeded ${ZONE_A_PINCODES.length + ZONE_B_PINCODES.length + ZONE_C_PINCODES.length + ZONE_X_PINCODES.length} pincodes`,
  );
  console.log("   Zone A (Metro):", ZONE_A_PINCODES.length);
  console.log("   Zone B (Tier-2):", ZONE_B_PINCODES.length);
  console.log("   Zone C (Rest of India):", ZONE_C_PINCODES.length);
  console.log("   Zone X (Not serviceable):", ZONE_X_PINCODES.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
