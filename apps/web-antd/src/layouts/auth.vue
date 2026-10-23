<script lang="ts" setup>
import { AuthPageLayout, logo } from '@vben/layouts';

import { $t } from '#/locales';

const appName = 'XnetAIops';
</script>

<template>
  <AuthPageLayout
    accent-color="#2f78b7"
    :app-name="appName"
    brand-surface="#0a1c2b"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
    :preview-alt="$t('authentication.previewAlt')"
    preview-image="/auth-platform.png"
    :product-summary="$t('authentication.platformSummary')"
    :toolbar-list="['language', 'theme']"
  />
</template>
