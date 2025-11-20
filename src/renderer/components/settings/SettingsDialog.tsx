/**
 * Settings Dialog Component
 * Manages application settings including API keys
 */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { claudeService } from '@/services/claude/ClaudeService';

export interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  // Load API key when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const result = await window.electron.invoke('settings:get', 'anthropic_api_key');
      if (result?.value) {
        // Show masked version
        setApiKey('sk-ant-' + '•'.repeat(40));
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setSaveStatus('idle');

      // Don't save if it's just the masked placeholder
      if (apiKey.includes('•')) {
        setSaveStatus('error');
        console.warn('Cannot save masked API key - please enter your actual API key');
        return;
      }

      await window.electron.invoke('settings:set', 'anthropic_api_key', apiKey);

      // ✅ CRITICAL FIX: Re-initialize ClaudeService with new API key
      // This allows immediate use of Claude API without app restart
      if (apiKey && apiKey.startsWith('sk-ant-')) {
        console.log('✅ Re-initializing ClaudeService with new API key...');
        claudeService.initialize(apiKey);
        console.log('✅ ClaudeService initialized - Claude API now available for Literature generation');
      }

      setSaveStatus('success');
      setTimeout(() => {
        handleOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border border-gray-200 bg-white p-6 shadow-xl duration-200',
            'rounded-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-2xl font-semibold text-gray-900">
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-700">API Configuration</h3>
              <Input
                label="Anthropic API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                helperText="Your API key is stored securely and never shared"
                disabled={isLoading}
              />
            </div>

            {/* Status Messages */}
            {saveStatus === 'success' && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                API key saved successfully!
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                Failed to save API key. Please try again.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={isLoading || !apiKey}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
