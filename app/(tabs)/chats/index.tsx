import { Content, MenuButton, Outer, TitleText } from '@/components/ui/header';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
export default function ChatsScreen() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Outer>
        <MenuButton sheetContext={{ open, onOpenChange: setOpen }} />
        <Content>
          <TitleText>Home</TitleText>
        </Content>
      </Outer>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation options</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}