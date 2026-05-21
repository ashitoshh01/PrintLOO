'use client';
import { useEffect, useState } from 'react';
import { Printer, File, Copy, FilePlus, Palette, Square } from 'lucide-react';
import { PrintConfig } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrintConfigFormProps {
  printer?: any;
  onChange: (config: PrintConfig) => void;
  initialConfig?: PrintConfig;
}

export default function PrintConfigForm({ printer, onChange, initialConfig }: PrintConfigFormProps) {
  const [config, setConfig] = useState<PrintConfig>(initialConfig || {
    colorMode: 'bw',
    sides: 'single',
    copies: 1,
    paperSize: 'A4'
  });

  // Trigger onChange whenever config changes
  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  const updateConfig = (key: keyof PrintConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Color Mode */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Color Mode</Label>
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => updateConfig('colorMode', 'bw')}
            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all
              ${config.colorMode === 'bw' ? 'border-brand-accent bg-brand-accent/5' : 'border-border hover:border-brand-accent/50'}
            `}
          >
            <Square className="w-8 h-8 text-foreground/70" />
            <span className="font-medium">Black & White</span>
          </div>
          <div 
            onClick={() => printer?.supportsColor !== false && updateConfig('colorMode', 'color')}
            className={`rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all
              ${config.colorMode === 'color' ? 'border-brand-accent bg-brand-accent/5' : 'border-border hover:border-brand-accent/50'}
              ${printer?.supportsColor === false ? 'opacity-50 cursor-not-allowed bg-secondary/50' : 'cursor-pointer'}
            `}
          >
            <Palette className="w-8 h-8 text-blue-500" />
            <span className="font-medium">Color</span>
            {printer?.supportsColor === false && <span className="text-xs text-muted-foreground">Not supported</span>}
          </div>
        </div>
      </div>

      {/* Sides */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Print Sides</Label>
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => updateConfig('sides', 'single')}
            className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all
              ${config.sides === 'single' ? 'border-brand-accent bg-brand-accent/5' : 'border-border hover:border-brand-accent/50'}
            `}
          >
            <File className="w-8 h-8 text-foreground/70" />
            <span className="font-medium">Single Side</span>
          </div>
          <div 
            onClick={() => printer?.supportsDuplex !== false && updateConfig('sides', 'duplex')}
            className={`rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all
              ${config.sides === 'duplex' ? 'border-brand-accent bg-brand-accent/5' : 'border-border hover:border-brand-accent/50'}
              ${printer?.supportsDuplex === false ? 'opacity-50 cursor-not-allowed bg-secondary/50' : 'cursor-pointer'}
            `}
          >
            <FilePlus className="w-8 h-8 text-foreground/70" />
            <span className="font-medium">Double Side</span>
            {printer?.supportsDuplex === false && <span className="text-xs text-muted-foreground">Not supported</span>}
          </div>
        </div>
      </div>

      {/* Copies & Paper Size */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Copies</Label>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => updateConfig('copies', Math.max(1, config.copies - 1))}
              disabled={config.copies <= 1}
            >
              -
            </Button>
            <div className="w-16 text-center font-semibold text-lg">{config.copies}</div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => updateConfig('copies', Math.min(100, config.copies + 1))}
              disabled={config.copies >= 100}
            >
              +
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="text-base font-semibold">Paper Size</Label>
          <Select 
            value={config.paperSize} 
            onValueChange={(val: any) => updateConfig('paperSize', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (Standard)</SelectItem>
              <SelectItem value="A3">A3 (Large)</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
