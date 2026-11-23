/// <reference types="nativewind/types" />
import 'react-native';

declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    fill?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    style?: any;
    className?: string;
  }
}
