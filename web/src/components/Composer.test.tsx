import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Composer } from "./Composer.tsx";

describe("Composer", () => {
  it("asks for a title before creating a task", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(
      <Composer
        open
        canDismiss={false}
        onOpen={() => {}}
        onDismiss={() => {}}
        onCreate={onCreate}
        titleRef={createRef()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Give the task a title.");
    expect(onCreate).not.toHaveBeenCalled();
  });
});
