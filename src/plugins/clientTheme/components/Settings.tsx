/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { ErrorCard } from "@components/ErrorCard";
import { Margins } from "@utils/margins";
import { findByCodeLazy, findStoreLazy } from "@webpack";
import { Button, ColorPicker, Forms, ThemeStore, useStateFromStores, Switch, Select } from "@webpack/common";
import { useState } from "@webpack/common";

import { settings } from "..";
import { relativeLuminance } from "../utils/colorUtils";
import { createOrUpdateThemeGradientVars } from "../utils/styleUtils";

const saveClientTheme = findByCodeLazy('type:"UNSYNCED_USER_SETTINGS_UPDATE', '"system"===');
const NitroThemeStore = findStoreLazy("ClientThemesBackgroundStore");

const cl = classNameFactory("vc-clientTheme-");

const colorPresets = [
    "#1E1514", "#172019", "#13171B", "#1C1C28", "#402D2D",
    "#3A483D", "#344242", "#313D4B", "#2D2F47", "#322B42",
    "#3C2E42", "#422938", "#b6908f", "#bfa088", "#d3c77d",
    "#86ac86", "#88aab3", "#8693b5", "#8a89ba", "#ad94bb",
];

const gradientDirections = [
    { label: "Top to Bottom", value: "to bottom" },
    { label: "Left to Right", value: "to right" },
    { label: "Top Left to Bottom Right", value: "to bottom right" },
    { label: "Top Right to Bottom Left", value: "to bottom left" },
    { label: "Radial (Center)", value: "radial-gradient(circle at center," },
    { label: "Radial (Top)", value: "radial-gradient(circle at top," }
];

function onPickColor(colorIndex: number, color: number) {
    const hexColor = color.toString(16).padStart(6, "0");
    const currentColors = [...settings.store.gradientColors];
    currentColors[colorIndex] = hexColor;
    
    settings.store.gradientColors = currentColors;
    createOrUpdateThemeGradientVars(currentColors, settings.store.gradientDirection, settings.store.useGradient);
}

function addColor() {
    if (settings.store.gradientColors.length < 10) {
        const newColors = [...settings.store.gradientColors, "313338"];
        settings.store.gradientColors = newColors;
        createOrUpdateThemeGradientVars(newColors, settings.store.gradientDirection, settings.store.useGradient);
    }
}

function removeColor(index: number) {
    if (settings.store.gradientColors.length > 2) {
        const newColors = settings.store.gradientColors.filter((_, i) => i !== index);
        settings.store.gradientColors = newColors;
        createOrUpdateThemeGradientVars(newColors, settings.store.gradientDirection, settings.store.useGradient);
    }
}

function setGradientDirection(direction: string) {
    settings.store.gradientDirection = direction;
    createOrUpdateThemeGradientVars(settings.store.gradientColors, direction, settings.store.useGradient);
}

function toggleGradientMode(useGradient: boolean) {
    settings.store.useGradient = useGradient;
    createOrUpdateThemeGradientVars(settings.store.gradientColors, settings.store.gradientDirection, useGradient);
}

function setDiscordTheme(theme: string) {
    saveClientTheme({ theme });
}

export function ThemeSettingsComponent() {
    const currentTheme = useStateFromStores([ThemeStore], () => ThemeStore.theme);
    const isLightTheme = currentTheme === "light";
    const oppositeTheme = isLightTheme ? "Dark" : "Light";

    const nitroThemeEnabled = useStateFromStores([NitroThemeStore], () => NitroThemeStore.gradientPreset != null);

    // Calculate average luminance for contrast warning
    const avgLuminance = settings.store.gradientColors.reduce((sum, color) => 
        sum + relativeLuminance(color), 0) / settings.store.gradientColors.length;

    let contrastWarning = false;
    let fixableContrast = true;

    if ((isLightTheme && avgLuminance < 0.26) || (!isLightTheme && avgLuminance > 0.12)) {
        contrastWarning = true;
    }

    if (avgLuminance < 0.26 && avgLuminance > 0.12) {
        fixableContrast = false;
    }

    if (isLightTheme && avgLuminance > 0.65) {
        contrastWarning = true;
        fixableContrast = false;
    }

    return (
        <div className={cl("settings")}>
            <div className={cl("container")}>
                <div className={cl("settings-labels")}>
                    <Forms.FormTitle tag="h3">Theme Color</Forms.FormTitle>
                    <Forms.FormText>Add colors to your Discord client theme with gradient support</Forms.FormText>
                </div>

                {/* Gradient Toggle */}
                <div className={cl("gradient-toggle")}>
                    <Switch 
                        value={settings.store.useGradient}
                        onChange={toggleGradientMode}
                        note="Enable gradient mode for multiple colors"
                    >
                        Use Gradient
                    </Switch>
                </div>

                {/* Gradient Direction Selector */}
                {settings.store.useGradient && (
                    <div className={cl("gradient-direction")}>
                        <Forms.FormTitle tag="h5">Gradient Direction</Forms.FormTitle>
                        <Select
                            options={gradientDirections}
                            value={settings.store.gradientDirection}
                            onChange={setGradientDirection}
                        />
                    </div>
                )}

                {/* Color Pickers */}
                <div className={cl("color-pickers")}>
                    {settings.store.gradientColors.map((color, index) => (
                        <div key={index} className={cl("color-picker-row")}>
                            <div className={cl("color-picker-container")}>
                                <Forms.FormTitle tag="h5">
                                    Color {index + 1} 
                                    {settings.store.useGradient && index === 0 && " (Start)"}
                                    {settings.store.useGradient && index === settings.store.gradientColors.length - 1 && index > 0 && " (End)"}
                                </Forms.FormTitle>
                                <ColorPicker
                                    color={parseInt(color, 16)}
                                    onChange={(newColor) => onPickColor(index, newColor)}
                                    showEyeDropper={false}
                                    suggestedColors={colorPresets}
                                />
                            </div>
                            {settings.store.useGradient && settings.store.gradientColors.length > 2 && (
                                <Button 
                                    onClick={() => removeColor(index)}
                                    color={Button.Colors.RED}
                                    size={Button.Sizes.SMALL}
                                    className={cl("remove-color-btn")}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Color Button */}
                {settings.store.useGradient && settings.store.gradientColors.length < 10 && (
                    <Button 
                        onClick={addColor}
                        color={Button.Colors.GREEN}
                        size={Button.Sizes.SMALL}
                        className={cl("add-color-btn")}
                    >
                        Add Color ({settings.store.gradientColors.length}/10)
                    </Button>
                )}
            </div>

            {/* Gradient Preview */}
            {settings.store.useGradient && (
                <div className={cl("gradient-preview-container")}>
                    <Forms.FormTitle tag="h5">Preview</Forms.FormTitle>
                    <div 
                        className={cl("gradient-preview")}
                        style={{
                            background: settings.store.gradientDirection.includes('radial')
                                ? `${settings.store.gradientDirection} ${settings.store.gradientColors.map(c => `#${c}`).join(', ')})`
                                : `linear-gradient(${settings.store.gradientDirection}, ${settings.store.gradientColors.map(c => `#${c}`).join(', ')})`
                        }}
                    />
                </div>
            )}

            {(contrastWarning || nitroThemeEnabled) && (
                <ErrorCard className={Margins.top8}>
                    <Forms.FormTitle tag="h2">Your theme won't look good!</Forms.FormTitle>

                    {contrastWarning && <Forms.FormText>{">"} Selected colors won't contrast well with text</Forms.FormText>}
                    {nitroThemeEnabled && <Forms.FormText>{">"} Nitro themes aren't supported</Forms.FormText>}

                    <div className={cl("buttons-container")}>
                        {(contrastWarning && fixableContrast) && (
                            <Button onClick={() => setDiscordTheme(oppositeTheme)} color={Button.Colors.RED}>
                                Switch to {oppositeTheme} mode
                            </Button>
                        )}
                        {nitroThemeEnabled && (
                            <Button onClick={() => setDiscordTheme(currentTheme)} color={Button.Colors.RED}>
                                Disable Nitro Theme
                            </Button>
                        )}
                    </div>
                </ErrorCard>
            )}
        </div>
    );
}

export function ResetThemeColorComponent() {
    return (
        <Button onClick={() => {
            settings.store.gradientColors = ["313338", "5865F2"];
            settings.store.useGradient = false;
            settings.store.gradientDirection = "to bottom";
            createOrUpdateThemeGradientVars(settings.store.gradientColors, settings.store.gradientDirection, false);
        }}>
            Reset Theme Colors
        </Button>
    );
}

// Updated CSS
const additionalCSS = `
.vc-clientTheme-gradient-toggle {
    margin: 16px 0;
}

.vc-clientTheme-gradient-direction {
    margin: 16px 0;
}

.vc-clientTheme-color-pickers {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: 16px 0;
}

.vc-clientTheme-color-picker-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.vc-clientTheme-color-picker-container {
    flex: 1;
}

.vc-clientTheme-remove-color-btn {
    margin-bottom: 4px;
}

.vc-clientTheme-add-color-btn {
    margin: 8px 0;
    align-self: flex-start;
}

.vc-clientTheme-gradient-preview-container {
    margin: 16px 0;
}

.vc-clientTheme-gradient-preview {
    width: 100%;
    height: 60px;
    border-radius: 8px;
    border: 1px solid var(--input-border);
}

.vc-clientTheme-container [class^="swatch"] {
    border: thin solid var(--input-border) !important;
}

.vc-clientTheme-buttons-container {
    margin-top: 16px;
    display: flex;
    gap: 4px;
}
`;

