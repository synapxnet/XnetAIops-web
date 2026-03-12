<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Button,
  Switch,
  Radio,
  RadioGroup,
  Space,
  message,
  Textarea,
  Divider,
  Alert,
} from 'ant-design-vue';
import {
  createPipeline,
  getPipeline,
  updatePipeline,
  getCredentials,
} from '../api/devops';
import PipelineEditor from '../components/PipelineEditor.vue';

const router = useRouter();
const route = useRoute();

const projectId = Number(route.params.projectId);
const pipelineId = route.query.pipelineId
  ? Number(route.query.pipelineId)
  : null;
const isEdit = computed(() => !!pipelineId);
const pageTitle = computed(() =>
  isEdit.value ? '编辑流水线' : '创建流水线',
);

const submitting = ref(false);
const loading = ref(false);
const credentials = ref<any[]>([]);
const advancedVisible = ref(false);

const form = reactive({
  name: '',
  description: '',
  type: 'pipeline',
  sourceType: 'none',
  sourceUrl: '',
  sourceBranch: 'main',
  credentialId: undefined as number | undefined,
  jenkinsfile: '',
  disableConcurrent: false,
  timerTrigger: '',
});

const showSourceFields = computed(
  () => form.sourceType !== 'none',
);

const showJenkinsfile = computed(
  () => form.sourceType === 'none' || form.type === 'pipeline',
);

// Load credentials for the project
async function loadCredentials() {
  try {
    const res = await getCredentials(projectId);
    credentials.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch {
    credentials.value = [];
  }
}

// Load pipeline data in edit mode
async function loadPipeline() {
  if (!pipelineId) return;
  loading.value = true;
  try {
    const res = await getPipeline(projectId, pipelineId);
    const data = res && typeof res === 'object' && 'data' in (res as any)
      ? (res as any).data
      : res;
    if (data) {
      form.name = data.name || '';
      form.description = data.description || '';
      form.type = data.type || 'pipeline';
      form.sourceType = data.sourceType || 'none';
      form.sourceUrl = data.sourceUrl || '';
      form.sourceBranch = data.sourceBranch || 'main';
      form.credentialId = data.credentialId ?? undefined;
      form.jenkinsfile = data.jenkinsfile || '';
      form.disableConcurrent = data.disableConcurrent ?? false;
      form.timerTrigger = data.timerTrigger || '';
    }
  } catch (e: any) {
    message.error('加载流水线数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

// Reset source fields when sourceType changes to "none"
watch(
  () => form.sourceType,
  (val) => {
    if (val === 'none') {
      form.sourceUrl = '';
      form.sourceBranch = 'main';
      form.credentialId = undefined;
    }
  },
);

async function handleSubmit() {
  if (!form.name.trim()) {
    message.warning('请输入流水线名称');
    return;
  }
  if (form.sourceType !== 'none' && !form.sourceUrl.trim()) {
    message.warning('请输入仓库地址');
    return;
  }
  if (showJenkinsfile.value && !form.jenkinsfile.trim()) {
    message.warning('请输入Jenkinsfile内容');
    return;
  }

  submitting.value = true;
  try {
    const payload = { ...form };
    if (isEdit.value && pipelineId) {
      await updatePipeline(projectId, pipelineId, payload);
      message.success('流水线更新成功');
    } else {
      await createPipeline(projectId, payload);
      message.success('流水线创建成功');
    }
    router.back();
  } catch (e: any) {
    message.error(
      (isEdit.value ? '更新' : '创建') + '失败: ' + e.message,
    );
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.back();
}

onMounted(async () => {
  await loadCredentials();
  if (isEdit.value) {
    await loadPipeline();
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="pageTitle" :loading="loading">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <Form layout="vertical" :model="form">
        <!-- 名称 -->
        <FormItem label="名称" required>
          <Input
            v-model:value="form.name"
            placeholder="请输入流水线名称"
          />
        </FormItem>

        <!-- 描述 -->
        <FormItem label="描述">
          <Textarea
            v-model:value="form.description"
            placeholder="请输入流水线描述"
            :rows="3"
          />
        </FormItem>

        <!-- 类型 -->
        <FormItem label="类型">
          <RadioGroup v-model:value="form.type">
            <Radio value="pipeline">自定义流水线</Radio>
            <Radio value="multi-branch">多分支流水线</Radio>
          </RadioGroup>
        </FormItem>

        <Divider />

        <!-- 代码来源 -->
        <FormItem label="代码来源">
          <Select v-model:value="form.sourceType" style="width: 100%">
            <SelectOption value="none">无</SelectOption>
            <SelectOption value="git">Git</SelectOption>
            <SelectOption value="github">GitHub</SelectOption>
            <SelectOption value="gitlab">GitLab</SelectOption>
          </Select>
        </FormItem>

        <!-- Source fields (shown when sourceType is not "none") -->
        <template v-if="showSourceFields">
          <FormItem label="仓库地址" required>
            <Input
              v-model:value="form.sourceUrl"
              placeholder="https://github.com/your-org/your-repo.git"
            />
          </FormItem>

          <FormItem label="分支">
            <Input
              v-model:value="form.sourceBranch"
              placeholder="main"
            />
          </FormItem>

          <FormItem label="凭证">
            <Select
              v-model:value="form.credentialId"
              style="width: 100%"
              placeholder="请选择凭证（可选）"
              allow-clear
            >
              <SelectOption
                v-for="cred in credentials"
                :key="cred.id"
                :value="cred.id"
              >
                {{ cred.name }}
                <span v-if="cred.type" style="color: #999">
                  ({{ cred.type }})
                </span>
              </SelectOption>
            </Select>
          </FormItem>
        </template>

        <Divider />

        <!-- Jenkinsfile -->
        <template v-if="showJenkinsfile">
          <FormItem label="Jenkinsfile" required>
            <PipelineEditor
              v-model="form.jenkinsfile"
              :initial-jenkinsfile="form.jenkinsfile"
            />
          </FormItem>

          <Divider />
        </template>

        <!-- 高级设置 -->
        <div style="margin-bottom: 16px">
          <Button type="link" @click="advancedVisible = !advancedVisible">
            {{ advancedVisible ? '收起' : '展开' }}高级设置
          </Button>
        </div>

        <template v-if="advancedVisible">
          <Alert
            type="info"
            message="高级设置为可选项，通常使用默认值即可"
            show-icon
            style="margin-bottom: 16px"
          />

          <FormItem label="禁止并发构建">
            <Switch v-model:checked="form.disableConcurrent" />
          </FormItem>

          <FormItem label="定时触发">
            <Input
              v-model:value="form.timerTrigger"
              placeholder="H/15 * * * *"
              style="max-width: 300px"
            />
          </FormItem>

          <Divider />
        </template>

        <!-- Submit -->
        <FormItem>
          <Space>
            <Button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
            >
              {{ isEdit ? '更新' : '创建' }}
            </Button>
            <Button @click="goBack">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
