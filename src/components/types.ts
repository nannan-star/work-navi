// 客户端使用的数据类型(日期经 RSC 序列化后为字符串)。

export interface Category {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
  _count?: { resources: number };
}

export interface ResourceLink {
  id: string;
  resourceId: string;
  label: string;
  url: string;
  order: number;
}

export interface Resource {
  id: string;
  projectId: string;
  categoryId: string;
  title: string;
  note: string | null;
  username: string | null;
  password: string | null;
  order: number;
  category?: Category;
  links: ResourceLink[];
}

export interface Project {
  id: string;
  name: string;
  desc: string | null;
  color: string;
  order: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
  _count?: { resources: number };
  resources?: Resource[];
}

export interface WeekNote {
  id: string;
  isoYear: number;
  isoWeek: number;
  startDate: string;
  endDate: string;
  content: string;
  updatedAt: string;
}

export interface WeekInfo {
  isoYear: number;
  isoWeek: number;
  key: string;
  label: string;
  range: string;
}
