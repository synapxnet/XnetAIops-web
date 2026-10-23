<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';
import { getCodeData } from '#/api/core/auth';
import { message } from 'ant-design-vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const CODE_LENGTH = 6;
const loginForm = ref<InstanceType<typeof AuthenticationCodeLogin>>();

/** 发送真实一次性验证码，失败时不启动倒计时。 Send a real one-time code; failed delivery never starts the countdown. */
async function sendCode() {
  const values = await loginForm.value?.getFormApi().getValues();
  const phone = String(values?.phoneNumber ?? '').trim();
  if (!/^1\d{10}$/.test(phone)) {
    message.warning($t('authentication.mobileErrortip'));
    throw new Error('INVALID_PHONE');
  }
  await getCodeData({ userPhone: phone });
}

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
        .refine((v) => /^\d{11}$/.test(v), {
          message: $t('authentication.mobileErrortip'),
        }),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        placeholder: $t('authentication.code'),
        showSendButton: true,
        handleSendCode: sendCode,
        // 依据发送状态显示按钮文字。 Label the send action from its countdown state.
        createText: (seconds: number) => seconds > 0 ? $t('authentication.sendText', [seconds]) : $t('authentication.sendCode'),
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
    ref="loginForm"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authCodeLogin"
  />
</template>
