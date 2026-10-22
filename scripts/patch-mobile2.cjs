// Second mobile patch: sort chips, "Load more" paging and shared validation on Tasks/Projects screens.
const fs = require('fs');
const root = 'C:/ProjectFlow-submission/mobile/src/app/';

function patch(file, pairs) {
  let s = fs.readFileSync(root + file, 'utf8');
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' missing anchor: ' + a.slice(0, 90));
    s = s.replace(a, b);
  }
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(root + file, s);
}

const sortChips = (name, options) => `      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>
        {${name}.map((option) => (
          <FilterChip key={option.value} label={option.label} active={sort === option.value} onPress={() => setSort(option.value)} />
        ))}
      </ScrollView>

`;

const footer = (items, noun) => `
          ListFooterComponent={
            ${items}.length < total ? (
              <View style={{ paddingVertical: 12 }}>
                <Button title={\`Load more (\${${items}.length} of \${total})\`} variant="secondary" onPress={() => setLimit((l) => l + 8)} />
              </View>
            ) : (
              <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 12 }}>
                {total} {total === 1 ? '${noun}' : '${noun}s'}
              </Text>
            )
          }`;

patch('tasks.tsx', [
  ["import { createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';", "import { createTask, deleteTask, getTasksPage, updateTask } from '@/services/tasks';\nimport { validateTask } from '@/shared/validation';"],
  ["  const [search, setSearch] = useState('');", "  const [search, setSearch] = useState('');\n  const [sort, setSort] = useState('createdAt:desc');\n  const [limit, setLimit] = useState(8);\n  const [total, setTotal] = useState(0);"],
  [
    "      const data = await getTasks({\n        search: search.trim(),\n        status: statusFilter === 'ALL' ? undefined : statusFilter,\n        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,\n        projectId: projectFilter ?? undefined,\n      });\n      setTasks(data);",
    "      const [sortBy, order] = sort.split(':');\n      const page = await getTasksPage({\n        search: search.trim(),\n        status: statusFilter === 'ALL' ? undefined : statusFilter,\n        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,\n        projectId: projectFilter ?? undefined,\n        limit,\n        sortBy,\n        order: order as 'asc' | 'desc',\n      });\n      setTasks(page.items);\n      setTotal(page.total);",
  ],
  ["  }, [logout, priorityFilter, projectFilter, search, statusFilter]);", "  }, [logout, priorityFilter, projectFilter, search, statusFilter, sort, limit]);"],
  [
    "    if (!form.name.trim()) {\n      Alert.alert('Validation required', 'Task name is required.');\n      return;\n    }\n\n    if (!form.projectId) {\n      Alert.alert('Validation required', 'Please select a project.');\n      return;\n    }",
    "    const check = validateTask({ name: form.name, projectId: form.projectId, dueDate: form.dueDate });\n    if (!check.ok) {\n      Alert.alert('Validation required', check.message);\n      return;\n    }",
  ],
  [
    "      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>\n        {taskStatusOptions.map(",
    sortChips('taskSortOptions') + "      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent} style={styles.filtersRow}>\n        {taskStatusOptions.map(",
  ],
  ["          data={displayTasks}\n          keyExtractor={(item) => String(item.id)}\n          contentContainerStyle={styles.listContent}", "          data={displayTasks}\n          keyExtractor={(item) => String(item.id)}\n          contentContainerStyle={styles.listContent}" + footer('tasks', 'task')],
  ["const priorityOptions = [", "const taskSortOptions = [\n  { label: 'Newest', value: 'createdAt:desc' },\n  { label: 'Due soon', value: 'dueDate:asc' },\n  { label: 'Priority', value: 'priority:desc' },\n  { label: 'A-Z', value: 'name:asc' },\n];\n\nconst priorityOptions = ["],
]);

patch('projects.tsx', [
  ["import { createProject, deleteProject, getProjects, updateProject } from '@/services/projects';", "import { createProject, deleteProject, getProjectsPage, updateProject } from '@/services/projects';\nimport { validateProject } from '@/shared/validation';"],
  ["  const [search, setSearch] = useState('');", "  const [search, setSearch] = useState('');\n  const [sort, setSort] = useState('createdAt:desc');\n  const [limit, setLimit] = useState(8);\n  const [total, setTotal] = useState(0);"],
  [
    "      const data = await getProjects(filters);\n      setProjects(data);",
    "      const [sortBy, order] = sort.split(':');\n      const page = await getProjectsPage({ ...filters, limit, sortBy, order: order as 'asc' | 'desc' });\n      setProjects(page.items);\n      setTotal(page.total);",
  ],
  ["  }, [logout, search, statusFilter]);", "  }, [logout, search, statusFilter, sort, limit]);"],
  [
    "    if (!form.name.trim()) {\n      Alert.alert('Validation required', 'Project name is required.');\n      return;\n    }",
    "    const check = validateProject({ name: form.name, startDate: form.startDate, endDate: form.endDate });\n    if (!check.ok) {\n      Alert.alert('Validation required', check.message);\n      return;\n    }",
  ],
  [
    "      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filterContent}>",
    sortChips('projectSortOptions') + "      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filterContent}>",
  ],
  ["          data={displayProjects}\n          keyExtractor={(item) => String(item.id)}\n          contentContainerStyle={styles.listContent}", "          data={displayProjects}\n          keyExtractor={(item) => String(item.id)}\n          contentContainerStyle={styles.listContent}" + footer('projects', 'project')],
]);

// projects.tsx needs the sort options constant too
let p = fs.readFileSync(root + 'projects.tsx', 'utf8');
if (!p.includes('const projectSortOptions')) {
  p = p.replace(/(export default function)/, "const projectSortOptions = [\n  { label: 'Newest', value: 'createdAt:desc' },\n  { label: 'A-Z', value: 'name:asc' },\n  { label: 'Status', value: 'status:asc' },\n  { label: 'Start date', value: 'startDate:asc' },\n];\n\n$1");
  fs.writeFileSync(root + 'projects.tsx', p);
}
console.log('mobile patch 2 ok');
