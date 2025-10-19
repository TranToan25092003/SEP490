import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

/**
 * @typedef {Object} Action
 * @property {string} key
 * @property {string} label
 * @property {() => Promise<void>} onExecute
 */

/**
 * @typedef {Object} SelectedItemsActionsProps
 * @property {number} selectedCount
 * @property {(count: number) => string} selectionMessage
 * @property {Action[]} actions
 */

/**
 * @param {SelectedItemsActionsProps} props
 * @returns {React.ReactElement | null}
 */
export const SelectedItemsActions = ({
  selectedCount,
  selectionMessage,
  actions,
}) => {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-2">
        <CheckIcon className="w-5 h-5 text-primary" />
        <span className="text-sm text-muted-foreground">{selectionMessage(selectedCount)}</span>
      </div>
      <div className="flex items-center gap-3">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn hành động" />
          </SelectTrigger>
          <SelectContent>
            {actions.map((action) => (
              <SelectItem key={action.key} value={action.key}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => {
            setLoading(true);
            actions
              .find((a) => a.key === action)
              ?.onExecute()
              .finally(() => setLoading(false));
          }}
          disabled={!action || loading}
        >
          {loading ? (
            <Spinner />
          ) : (
            'Thực hiện'
          )}
        </Button>
      </div>
    </div>
  );
};
