import { CategoryCards } from './shell';
import {
  ChartDemo,
  FeedbackDemo,
  ListWorkflow,
  RemoteSelectionDemo,
  SaveWorkflow,
} from '../workflow-demos';

export const workflowNames = [
  'FormSection',
  'FormActions',
  'FormErrorSummary',
  'FilterBar',
  'ActiveFilters',
  'BulkActionBar',
  'DataPagination',
  'BarChart',
  'LineChart',
  'Sparkline',
  'FileUploadList',
  'NotificationList',
  'InlineEdit',
  'SelectionCard',
  'MegaIcon',
  'MultiSelect',
] as const;
export function WorkflowsCategory() {
  return (
    <CategoryCards
      code="WORKFLOW"
      order={['Forms', 'Lists', 'Charts', 'Feedback', 'MultiSelect']}
      groups={{
        Forms: ['FormSection', 'FormActions', 'FormErrorSummary'],
        Lists: [
          'FilterBar',
          'ActiveFilters',
          'BulkActionBar',
          'DataPagination',
        ],
        Charts: ['BarChart', 'LineChart', 'Sparkline'],
        Feedback: [
          'FileUploadList',
          'NotificationList',
          'InlineEdit',
          'SelectionCard',
          'MegaIcon',
        ],
      }}
      demos={{
        Forms: <SaveWorkflow />,
        Lists: <ListWorkflow />,
        Charts: <ChartDemo />,
        Feedback: <FeedbackDemo />,
        MultiSelect: <RemoteSelectionDemo />,
      }}
    />
  );
}
