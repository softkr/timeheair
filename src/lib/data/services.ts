import { ServiceMenu } from "../types";

export const serviceMenus: ServiceMenu[] = [
  // 기본 서비스
  {
    id: "cut-male",
    category: "기본 서비스",
    name: "남자컷트",
    price: 11000,
  },
  {
    id: "cut-female",
    category: "기본 서비스",
    name: "여자컷트",
    price: 11000,
    options: [{ name: "샴푸", price: 5000 }],
  },
  {
    id: "setting-dry",
    category: "기본 서비스",
    name: "셋팅드라이",
    price: 11000,
    options: [{ name: "샴푸", price: 5000 }],
  },
  {
    id: "dry-male",
    category: "기본 서비스",
    name: "남자드라이",
    price: 11000,
  },
  {
    id: "cut-student",
    category: "기본 서비스",
    name: "학생 컷트(어린이)",
    price: 8800,
  },

  // 퍼머/매직/염색
  {
    id: "perm-basic",
    category: "퍼머/매직/염색",
    name: "기본 (건강모/일반)",
    prices: { short: 33000, medium: 44000, long: 66000 },
  },
  {
    id: "perm-premium",
    category: "퍼머/매직/염색",
    name: "고급영양 (펌/매직/염색)",
    prices: { short: 55000, medium: 66000, long: 88000 },
  },
  {
    id: "perm-unique",
    category: "퍼머/매직/염색",
    name: "유니크펌 (물펌/먹물)",
    prices: { short: 66000, medium: 88000, long: 110000 },
  },
  {
    id: "perm-carisma",
    category: "퍼머/매직/염색",
    name: "까리시마 실크펌 (매직)",
    prices: { short: 88000, medium: 110000, long: 165000 },
  },
  {
    id: "perm-clinic",
    category: "퍼머/매직/염색",
    name: "재생크리닉 (매직)",
    prices: { short: 110000, medium: 165000, long: 220000 },
  },

  // 볼륨매직/셋팅/디지털/이온펌
  {
    id: "volume-basic",
    category: "볼륨매직/셋팅",
    name: "기본 (건강모/일반)",
    prices: { short: 66000, medium: 77000, long: 88000 },
  },
  {
    id: "volume-premium",
    category: "볼륨매직/셋팅",
    name: "고급영양 (염색모)",
    prices: { short: 77000, medium: 88000, long: 99000 },
  },
  {
    id: "volume-carisma",
    category: "볼륨매직/셋팅",
    name: "까리시마 실크펌 (셋팅 볼륨)",
    prices: { short: 110000, medium: 165000, long: 220000 },
  },
  {
    id: "volume-magic-setting",
    category: "볼륨매직/셋팅",
    name: "매직 셋팅",
    prices: { short: 88000, medium: 165000, long: 220000 },
  },

  // 탈색/염색
  {
    id: "bleach",
    category: "탈색/염색",
    name: "탈색",
    prices: { short: 33000, medium: 44000, long: 66000 },
  },
  {
    id: "dye-pay",
    category: "탈색/염색",
    name: "페이염색",
    prices: { short: 88000, medium: 143000, long: 143000 },
  },
  {
    id: "dye-miel",
    category: "탈색/염색",
    name: "미엘염색",
    prices: { short: 44000, medium: 77000, long: 110000 },
  },

  // 두피/크리닉/피스
  {
    id: "clinic-basic",
    category: "두피/크리닉",
    name: "크리닉(일반)",
    price: 33000,
  },
  {
    id: "clinic-premium",
    category: "두피/크리닉",
    name: "고급영양",
    price: 55000,
  },
  {
    id: "clinic-regen",
    category: "두피/크리닉",
    name: "재생크리닉",
    price: 88000,
  },
  {
    id: "scalp-scaling",
    category: "두피/크리닉",
    name: "두피스켈링",
    price: 33000,
  },
];

export const serviceCategories = [
  '기본 서비스',
  '퍼머/매직/염색',
  '볼륨매직/셋팅',
  '탈색/염색',
  '두피/크리닉',
];
