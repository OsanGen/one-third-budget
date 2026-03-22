import React from 'react';
import Card from './Card';
import SectionHeader from './SectionHeader';
import HelperText from './HelperText';

type EmptyStateCardProps = {
  title: string;
  description: string;
};

export default function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <Card>
      <SectionHeader title={title} />
      <HelperText>{description}</HelperText>
    </Card>
  );
}
