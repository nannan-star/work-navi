// 预置数据:默认分类 + 3 个示例项目 + 资源 + 最近几周周记。
// 运行:npm run db:seed

import { PrismaClient } from "@prisma/client";
import { getWeekInfo, formatWeekRange } from "../src/lib/week";

const prisma = new PrismaClient();

interface SeedResource {
  category: string;
  title: string;
  url?: string;
  note?: string;
  username?: string;
  password?: string;
}

interface SeedProject {
  name: string;
  desc: string;
  color: string;
  resources: SeedResource[];
}

async function main() {
  // 清空(开发用)
  await prisma.resource.deleteMany();
  await prisma.weekNote.deleteMany();
  await prisma.project.deleteMany();
  await prisma.category.deleteMany();

  // 1. 默认分类
  const catDefs = [
    { name: "需求", color: "req" },
    { name: "环境", color: "env" },
    { name: "任务", color: "task" },
    { name: "原型", color: "proto" },
    { name: "Git", color: "git" },
  ];
  const cats: Record<string, string> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const c = await prisma.category.create({ data: { ...catDefs[i], order: i } });
    cats[c.name] = c.id;
  }

  // 2. 示例项目
  const projDefs: SeedProject[] = [
    {
      name: "运营平台",
      desc: "内部运营管理平台。集中记录各环境地址、需求文档、原型与部署凭证。",
      color: "indigo",
      resources: [
        { category: "环境", title: "生产环境 · 后台", url: "https://admin.shop.example.com", note: "生产管理后台，改配置前先在群里同步。", username: "ops_admin", password: "Demo@Pass123" },
        { category: "环境", title: "测试环境", url: "https://test.shop.example.com", note: "QA 联调环境，每晚 2 点自动部署最新 develop 分支。", username: "tester", password: "Test@2026" },
        { category: "环境", title: "MySQL 主库", url: "10.20.3.15:3306", note: "订单域主库，只读账号。", username: "root_ro", password: "Read@Only8" },
        { category: "需求", title: "PRD · 订单域重构", url: "https://doc.example.com/prd/order-v2", note: "v2.3 已评审通过，附带状态机流转图。" },
        { category: "需求", title: "接口文档 (Apifox)", url: "https://apifox.com/team/shop" },
        { category: "原型", title: "Figma · 后台原型", url: "https://figma.com/file/xxx/shop-admin", note: "最新交互稿在 \"v3 - 终稿\" 页面。" },
      ],
    },
    {
      name: "SWAS星基",
      desc: "星基增强服务。卫星定位、差分改正与完好性监测。",
      color: "green",
      resources: [
        { category: "环境", title: "星基·生产平台", url: "https://swas-sat.example.com", username: "sat_admin", password: "Sat@2026" },
        { category: "环境", title: "星基·联调环境", url: "https://swas-sat-dev.example.com", username: "dev", password: "Dev@2026" },
        { category: "需求", title: "星基需求池", url: "https://doc.example.com/swas/req" },
        { category: "Git", title: "SWAS 星基仓库", url: "https://git.example.com/swas/sat" },
        { category: "任务", title: "星基迭代看板", url: "https://jira.example.com/swas-sat" },
      ],
    },
    {
      name: "SWAS地基",
      desc: "地基增强服务。基准站网、差分数据播发与运维监控。",
      color: "sky",
      resources: [
        { category: "环境", title: "地基·监控大屏", url: "https://swas-gnd-monitor.example.com", username: "gnd", password: "Gnd@2026" },
        { category: "环境", title: "基准站数据接入", url: "https://swas-gnd.example.com" },
        { category: "Git", title: "SWAS 地基仓库", url: "https://git.example.com/swas/gnd" },
        { category: "原型", title: "地基监控原型", url: "https://figma.com/file/xxx/swas-gnd" },
      ],
    },
  ];

  for (const p of projDefs) {
    const project = await prisma.project.create({
      data: { name: p.name, desc: p.desc, color: p.color },
    });
    for (let i = 0; i < p.resources.length; i++) {
      const { category, ...rest } = p.resources[i];
      await prisma.resource.create({
        data: { ...rest, categoryId: cats[category], projectId: project.id, order: i },
      });
    }
  }

  // 3. 最近 4 周周记(当前周 + 前 3 周)
  const cur = getWeekInfo();
  const weeks = [
    {
      off: 0,
      content: "## 本周重点\n- [x] 订单状态机重构 PR 合并\n- [ ] 库存扣减防超卖压测（周四前）\n- [ ] 联调支付回调 → 找老王要沙箱密钥\n\n## 待排期\n- 商品域缓存改造\n- 老接口下线（等前端全量切换）\n\n## 备忘\n- 生产发布窗口：每周二/四 20:00\n- prod 密码下次轮换：3/15",
    },
    {
      off: 1,
      content: "## 本周重点\n- [x] 完成商品详情页重构\n- [x] 修复库存超卖 bug（乐观锁 + 重试）\n- [x] 周会评审 PRD v2.3，已通过\n\n## 备忘\n- 下周开始接支付回调",
    },
    {
      off: 2,
      content: "## 本周重点\n- [x] 搭建 CI/CD 流水线（GitLab Runner）\n- [x] 接入监控告警（Prometheus + 钉钉）\n- [x] 整理三大环境配置文档\n- [x] 数据库读写分离验证\n- [x] 压测基线报告",
    },
    {
      off: 3,
      content: "## 本周重点\n- [x] 项目启动会\n- [x] 技术选型评审（Spring Cloud + Nacos）\n- [x] 拆分订单/商品/库存三大域\n- [x] 搭建脚手架 & 代码规范",
    },
  ];

  for (const w of weeks) {
    const monday = new Date(cur.startDate);
    monday.setUTCDate(monday.getUTCDate() - w.off * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const iso = getWeekInfo(monday);
    await prisma.weekNote.create({
      data: {
        isoYear: iso.isoYear,
        isoWeek: iso.isoWeek,
        startDate: monday,
        endDate: sunday,
        content: w.content,
      },
    });
  }

  const pCount = await prisma.project.count();
  const rCount = await prisma.resource.count();
  const cCount = await prisma.category.count();
  const wCount = await prisma.weekNote.count();
  console.log(`✅ 预置完成:${pCount} 项目 / ${rCount} 资源 / ${cCount} 分类 / ${wCount} 周周记`);
  console.log(`   当前周:${cur.label}(${formatWeekRange(cur.isoYear, cur.isoWeek)})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
