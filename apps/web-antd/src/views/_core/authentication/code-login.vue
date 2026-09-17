<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：验证码登录入口。Purpose: Verification-code login entry.
Author: maoyo | Department: 研发部 | Date: 2026-09-14
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const authStore = useAuthStore();
const CODE_LENGTH = 6;

/** 默认登录字段留空并保留原有校验。Keep login fields empty and preserve the existing validation. */
const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mobile'),
      },
      defaultValue: '',
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.mobileTip') })
        .refine(
          /** 验证用户实际填写的11位手机号。Validate the eleven-digit phone number supplied by the user. */
          (v) => /^\d{11}$/.test(v),
          {
            message: $t('authentication.mobileErrortip'),
          },
        ),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        placeholder: $t('authentication.code'),
        showSendButton: false,
      },
      defaultValue: '',
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(CODE_LENGTH, {
        message: $t('authentication.codeTip', [CODE_LENGTH]),
      }),
    },
  ];
});
</script>

<template>
  <AuthenticationCodeLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authCodeLogin"
  />
</template>
