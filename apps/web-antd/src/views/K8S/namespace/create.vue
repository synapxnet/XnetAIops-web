<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  Button,
  Space,
  message,
} from 'ant-design-vue';
import { createNamespace } from '../api/namespace';

const router = useRouter();
const route = useRoute();
const clusterId = Number(route.query.clusterId);
const submitting = ref(false);

const form = ref({
  name: '',
});

async function handleSubmit() {
  if (!form.value.name.trim()) {
    message.warning('请输入命名空间名称');
    return;
  }
  if (!/^[a-z][\da-z-]*[a-z\d]$/.test(form.value.name) && form.value.name.length > 1) {
    message.warning('命名空间名称只能包含小写字母、数字和连字符');
    return;
  }
  submitting.value = true;
  try {
    await createNamespace(clusterId, { name: form.value.name });
    message.success('命名空间创建成功');
    router.push('/K8S/namespace/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/K8S/namespace/list');
}
</script>

<template>
  <div class="p-4">
    <Card title="创建命名空间">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <Form layout="vertical" :model="form" style="max-width: 600px;">
        <FormItem label="命名空间名称" required>
          <Input
            v-model:value="form.name"
            placeholder="请输入命名空间名称（小写字母、数字、连字符）"
          />
        </FormItem>

        <FormItem>
          <Space>
            <Button type="primary" :loading="submitting" @click="handleSubmit">创建</Button>
            <Button @click="goBack">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
