/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 运行保障工作台入口。 Routes for the operations evidence workspace.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'OperationsWorkspace',
    path: '/AGENT/operations',
    // 按需加载运行保障工作区。 Loads the operations workspace on demand.
    component: () => import('#/views/AGENT/operations.vue'),
    meta: { icon: 'lucide:activity', order: 2, title: '运行保障' },
  },
];

export default routes;
