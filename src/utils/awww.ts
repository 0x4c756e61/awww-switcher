import { exec, execSync } from "child_process";
import { showToast, Toast } from "@vicinae/api";
import { runConvertSplit, runPostProduction } from "./imagemagik";
import { callColorGen } from "./colorgen";

export async function omniCommand(
  path: string,
  monitor: string,
  transition: string,
  steps: number,
  duration: number,
  apptoggle: boolean,
  colorApp: string,
  fps: number,
  postProduction: string,
) {
  let success: boolean;

  if (monitor === "ALL") {
    success = await setWallpaper(path, transition, steps, duration, fps);
  } else if (monitor.includes("|")) {
    const splitImages = await runConvertSplit(path);
    const monitors = monitor.split("|");

    const ok1 = await setWallpaperOnMonitor(splitImages[0], monitors[0], transition, steps, duration, fps);
    const ok2 = await setWallpaperOnMonitor(splitImages[1], monitors[1], transition, steps, duration, fps);

    success = ok1 && ok2;
  } else {
    success = await setWallpaperOnMonitor(path, monitor, transition, steps, duration, fps);
  }

  if (success) {
    if (apptoggle) {
      toggleVicinae();
    }
    if (colorApp !== "none") {
      const colorGenSuccess = await callColorGen(path, colorApp);

      if (colorGenSuccess) {
        showToast({
          style: Toast.Style.Success,
          title: "Wall set, colors generated!",
        });
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Color generation failed",
        });
      }
    }
    if (postProduction !== "no") {
      const postProdSuccess = await runPostProduction(path, postProduction);

      if (postProdSuccess) {
        showToast({
          style: Toast.Style.Success,
          title: "Wall set, colors generated, post proc done!",
        });
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Post processing failed",
        });
      }
    }
  } else {
    showToast({
      style: Toast.Style.Failure,
      title: "ERROR: Check awww-daemon status",
      message: "Make sure awww is installed and its daemon is running (awww-daemon).",
    });
  }
}

export const setWallpaper = async (
  path: string,
  transition: string,
  steps: number,
  seconds: number,
  fps: number,
): Promise<boolean> => {
  try {
    execSync("awww query", { stdio: "pipe" });

    return await new Promise<boolean>((resolve) => {
      exec(
        `awww img "${path}" -t ${transition} --transition-step ${steps} --transition-fps ${fps} --transition-duration ${seconds}`,
        (error) => {
          if (error) {
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  } catch (error) {
    return false;
  }
};

export const setWallpaperOnMonitor = async (
  path: string,
  monitorName: string,
  transition: string,
  steps: number,
  seconds: number,
  fps: number,
): Promise<boolean> => {
  try {
    return await new Promise<boolean>((resolve) => {
      exec(
        `awww img "${path} --outputs "${monitorName}" -t ${transition} --transition-step ${steps} --transition-fps ${fps} --transition-duration ${seconds}`,
        (error) => {
          if (error) {
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  } catch (error) {
    return false;
  }
};
export const toggleVicinae = (): void => {
  exec(`vicinae vicinae://toggle`);
};
